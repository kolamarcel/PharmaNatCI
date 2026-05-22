#!/usr/bin/env python3
"""Convert MySQL dump (pharmacienatci.sql) to PostgreSQL format."""

import re

INPUT = 'pharmacienatci.sql'
OUTPUT = 'pharmacienatci_pg.sql'


def backtick_to_dquote(s):
    return re.sub(r'`(\w+)`', r'"\1"', s)


def convert_col_type(line):
    # int(N) UNSIGNED -> integer
    line = re.sub(r'\bint\(\d+\) UNSIGNED\b', 'integer', line)
    line = re.sub(r'\bint\(\d+\)\b', 'integer', line)
    # bigint
    line = re.sub(r'\bbigint\(\d+\) UNSIGNED\b', 'bigint', line)
    line = re.sub(r'\bbigint\(\d+\)\b', 'bigint', line)
    # smallint
    line = re.sub(r'\bsmallint\(\d+\) UNSIGNED\b', 'smallint', line)
    line = re.sub(r'\bsmallint\(\d+\)\b', 'smallint', line)
    # tinyint(1) -> smallint (will be cast to boolean at the end)
    line = re.sub(r'\btinyint\(1\)\b', 'smallint', line)
    line = re.sub(r'\btinyint\(\d+\)\b', 'smallint', line)
    # text types
    line = re.sub(r'\blongtext\b', 'text', line)
    line = re.sub(r'\bmediumtext\b', 'text', line)
    # datetime -> timestamp
    line = re.sub(r'\bdatetime\(\d+\)\b', 'timestamp', line)
    line = re.sub(r'\bdatetime\b', 'timestamp', line)
    # double -> double precision
    line = re.sub(r'\bdouble\b', 'double precision', line)
    # Remove remaining UNSIGNED
    line = re.sub(r'\bUNSIGNED\b', '', line)
    # Remove CHECK (col >= 0) added for unsigned
    line = re.sub(r' CHECK \(`\w+` >= 0\)', '', line)
    return line


def parse_alter_table(table, body_lines):
    """Parse MySQL ALTER TABLE body and return (pg_clauses, index_statements)."""
    pg_clauses = []
    index_stmts = []

    for line in body_lines:
        line = line.strip().rstrip(',').rstrip(';').strip()
        if not line:
            continue

        # ADD PRIMARY KEY
        m = re.search(r'ADD PRIMARY KEY \(([^)]+)\)', line)
        if m:
            cols = backtick_to_dquote(m.group(1))
            pg_clauses.append(f'  ADD PRIMARY KEY ({cols})')
            continue

        # ADD UNIQUE KEY name (cols)
        m = re.search(r'ADD UNIQUE KEY `(\w+)` \(([^)]+)\)', line)
        if m:
            name, cols = m.group(1), backtick_to_dquote(m.group(2))
            pg_clauses.append(f'  ADD CONSTRAINT "{name}" UNIQUE ({cols})')
            continue

        # ADD KEY name (cols) -> CREATE INDEX
        m = re.search(r'ADD KEY `(\w+)` \(([^)]+)\)', line)
        if m:
            name, cols = m.group(1), backtick_to_dquote(m.group(2))
            index_stmts.append(f'CREATE INDEX IF NOT EXISTS "{name}" ON "{table}" ({cols});')
            continue

        # ADD CONSTRAINT ... FOREIGN KEY
        m = re.search(
            r'ADD CONSTRAINT `(\w+)` FOREIGN KEY \(([^)]+)\) REFERENCES `(\w+)` \(([^)]+)\)',
            line
        )
        if m:
            name = m.group(1)
            cols = backtick_to_dquote(m.group(2))
            ref_table = m.group(3)
            ref_cols = backtick_to_dquote(m.group(4))
            pg_clauses.append(
                f'  ADD CONSTRAINT "{name}" FOREIGN KEY ({cols}) REFERENCES "{ref_table}" ({ref_cols})'
            )
            continue

    return pg_clauses, index_stmts


def main():
    with open(INPUT, encoding='utf-8') as f:
        lines = f.readlines()

    # --- Phase 1: collect tinyint(1) and auto-increment columns ---
    bool_cols = {}    # table -> [col, ...]
    auto_inc_cols = {}  # table -> (col, 'integer'|'bigint')

    current_table = None
    in_create = False

    for line in lines:
        s = line.rstrip('\n')
        m = re.match(r'CREATE TABLE `(\w+)`', s)
        if m:
            current_table = m.group(1)
            bool_cols[current_table] = []
            in_create = True
            continue
        if in_create:
            m2 = re.match(r'\s+`(\w+)`\s+tinyint\(1\)', s)
            if m2:
                bool_cols[current_table].append(m2.group(1))
            if re.match(r'\) ENGINE=', s) or s.strip() == ');':
                in_create = False

    # Collect AUTO_INCREMENT from ALTER TABLE MODIFY sections
    # Pattern: ALTER TABLE `t`\n  MODIFY `col` int(...) NOT NULL AUTO_INCREMENT[, AUTO_INCREMENT=N];
    current_alt = None
    for line in lines:
        s = line.rstrip('\n')
        m = re.match(r'ALTER TABLE `(\w+)`', s)
        if m:
            current_alt = m.group(1)
            continue
        if current_alt:
            m2 = re.search(r'MODIFY `(\w+)` (int|bigint)\(\d+\) NOT NULL AUTO_INCREMENT', s)
            if m2:
                col = m2.group(1)
                typ = 'integer' if m2.group(2) == 'int' else 'bigint'
                # Check for explicit starting value AUTO_INCREMENT=N
                m3 = re.search(r'AUTO_INCREMENT=(\d+)', s)
                start_val = int(m3.group(1)) if m3 else None
                auto_inc_cols[current_alt] = (col, typ, start_val)
            if s.strip().endswith(';'):
                current_alt = None

    # --- Phase 2: generate PostgreSQL SQL ---
    out = []

    # Header
    out.append('-- PostgreSQL dump converted from MySQL')
    out.append('-- Generated by convert_mysql_to_pg.py')
    out.append('')
    out.append('SET standard_conforming_strings = off;')
    out.append('SET escape_string_warning = off;')
    out.append('SET client_encoding = \'UTF8\';')
    out.append('')

    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        s = line.rstrip('\n')

        # Skip MySQL conditional comments
        if re.match(r'\s*/\*!', s):
            i += 1
            continue

        # Skip MySQL-specific SET statements
        if re.match(r'\s*(SET SQL_MODE|SET time_zone|SET NAMES|SET @OLD_|SET CHARACTER_SET_)', s):
            i += 1
            continue

        # Skip START TRANSACTION / COMMIT (we'll wrap our own)
        if s.strip() in ('START TRANSACTION;', 'COMMIT;'):
            i += 1
            continue

        # CREATE TABLE
        m = re.match(r'CREATE TABLE `(\w+)`', s)
        if m:
            table = m.group(1)
            out.append(f'CREATE TABLE IF NOT EXISTS "{table}" (')
            i += 1
            while i < n:
                col_line = lines[i].rstrip('\n')
                # End of CREATE TABLE
                if re.match(r'\) ENGINE=', col_line) or col_line.strip() == ');':
                    out.append(');')
                    out.append('')
                    i += 1
                    break
                # Convert column definition
                converted = convert_col_type(backtick_to_dquote(col_line))
                out.append(converted)
                i += 1
            continue

        # INSERT INTO
        if re.match(r'INSERT INTO `', s):
            out.append(backtick_to_dquote(s))
            i += 1
            # Copy value rows until semicolon
            while i < n:
                val_line = lines[i].rstrip('\n')
                out.append(val_line)
                i += 1
                if val_line.rstrip().endswith(';'):
                    break
            out.append('')
            continue

        # ALTER TABLE
        m = re.match(r'ALTER TABLE `(\w+)`', s)
        if m:
            table = m.group(1)
            body = [s]
            i += 1
            # Collect all continuation lines
            while i < n:
                al = lines[i].rstrip('\n')
                body.append(al)
                i += 1
                if al.strip().endswith(';'):
                    break

            full_text = ' '.join(body)

            # Skip MODIFY / AUTO_INCREMENT blocks
            if 'MODIFY' in full_text and 'AUTO_INCREMENT' in full_text:
                continue

            pg_clauses, index_stmts = parse_alter_table(table, body)

            if pg_clauses:
                out.append(f'ALTER TABLE "{table}"')
                out.append(',\n'.join(pg_clauses) + ';')
                out.append('')

            for stmt in index_stmts:
                out.append(stmt)
            if index_stmts:
                out.append('')

            continue

        # Everything else (comments, blank lines, etc.)
        out.append(s)
        i += 1

    # --- Sequences for auto-increment columns ---
    if auto_inc_cols:
        out.append('')
        out.append('-- Sequences for auto-increment columns')
        for table, (col, typ, start_val) in auto_inc_cols.items():
            seq = f'{table}_{col}_seq'
            out.append(f'CREATE SEQUENCE IF NOT EXISTS "{seq}";')
            out.append(
                f'ALTER TABLE "{table}" ALTER COLUMN "{col}" SET DEFAULT nextval(\'{seq}\');'
            )
            if start_val:
                # Use the explicit AUTO_INCREMENT value from the dump
                out.append(f"SELECT setval('{seq}', {start_val}, false);")
            else:
                # Derive from the actual max value in the table
                out.append(
                    f"SELECT setval('{seq}', COALESCE((SELECT MAX(\"{col}\") FROM \"{table}\"), 0) + 1, false);"
                )
        out.append('')

    # --- Cast smallint -> boolean for tinyint(1) columns ---
    bool_to_convert = {t: cols for t, cols in bool_cols.items() if cols}
    if bool_to_convert:
        out.append('-- Cast smallint to boolean for tinyint(1) columns')
        for table, cols in bool_to_convert.items():
            for col in cols:
                out.append(
                    f'ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE boolean USING ("{col}" != 0);'
                )
        out.append('')

    # Write output
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))

    print(f'Conversion complete -> {OUTPUT}')
    print(f'  Tables with boolean cols: {len(bool_to_convert)}')
    print(f'  Tables with sequences:    {len(auto_inc_cols)}')


if __name__ == '__main__':
    main()
