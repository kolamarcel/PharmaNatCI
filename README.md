# PharmaNatCI

Application web de gestion des pharmacies en Côte d'Ivoire. Elle permet le suivi des stocks, des mouvements de médicaments, des commandes, des transferts inter-établissements, et intègre un moteur de prévision basé sur le machine learning pour anticiper les ruptures de stock.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Django 6, Django REST Framework, SimpleJWT |
| Frontend | Angular 21, Angular Material, TailwindCSS |
| Base de données | MySQL **ou** PostgreSQL (au choix du développeur) |
| Machine Learning | scikit-learn, pandas, numpy |
| Cartographie | Leaflet |
| Graphiques | Chart.js / ng2-charts |

---

## Prérequis

Assure-toi d'avoir installé les outils suivants :

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) avec npm
- [Angular CLI 21](https://angular.dev/tools/cli) — `npm install -g @angular/cli@21`
- [Git](https://git-scm.com/)
- [MySQL](https://www.mysql.com/) **ou** [PostgreSQL](https://www.postgresql.org/) selon ta préférence

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <URL_DU_REPO>
cd PharmaNatCI
```

---

### 2. Backend Django

```bash
cd pharmacienatci
```

**Créer et activer l'environnement virtuel**

```bash
# Windows PowerShell
python -m venv venv
venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

**Installer les dépendances**

```bash
pip install -r requirements.txt
```

**Configurer la base de données**

Crée un fichier `.env` dans le dossier `pharmacienatci/` avec le contenu suivant :

```env
# MySQL
DATABASE_URL=mysql://root:motdepasse@127.0.0.1:3306/pharmacienatci

# OU PostgreSQL
DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/pharmacienatci
```

> Le préfixe de l'URL (`mysql://` ou `postgresql://`) suffit à sélectionner automatiquement le bon moteur. Chaque développeur adapte cette ligne selon son environnement.

**Créer la base de données** (dans ton client MySQL ou PostgreSQL) :

```sql
CREATE DATABASE pharmacienatci;
```

**Appliquer les migrations**

```bash
python manage.py migrate
```

**Importer les données**

Le dump de la base de données se trouve dans `pharmacienatci/pharmacienatci.sql` (format MySQL/MariaDB).

<details>
<summary>MySQL</summary>

Importe le dump directement avec le client MySQL :

```bash
mysql -u root -p pharmacienatci < pharmacienatci.sql
```

Ou depuis le client MySQL :

```sql
USE pharmacienatci;
SOURCE pharmacienatci.sql;
```

</details>

<details>
<summary>PostgreSQL</summary>

Le dump est au format MySQL — il faut d'abord le convertir. Un script de conversion est fourni dans le projet.

**Étape 1 — Générer le script d'import PostgreSQL**

```bash
# Depuis le dossier pharmacienatci/
python generate_pg_import.py
```

Cela crée le fichier `import_data.sql` adapté à PostgreSQL.

**Étape 2 — Importer les données**

```bash
# Remplace "postgres" et "motdepasse" par tes identifiants
PGPASSWORD=motdepasse psql -U postgres -h localhost -p 5432 -d pharmacienatci -f import_data.sql
```

Sur Windows (si `psql` n'est pas dans le PATH) :

```powershell
$env:PGPASSWORD="motdepasse"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -d pharmacienatci -f import_data.sql
```

> **Note :** Le script gère automatiquement la conversion des types MySQL (`tinyint(1)` → `boolean`, etc.), la remise à zéro des séquences et le respect des contraintes de clés étrangères.

</details>

**Créer un super-utilisateur** *(optionnel)*

```bash
python manage.py createsuperuser
```

**Lancer le serveur**

```bash
python manage.py runserver
```

API disponible sur : `http://127.0.0.1:8000/api/`
Interface admin : `http://127.0.0.1:8000/admin/`

---

### 3. Frontend Angular

Dans un nouveau terminal, depuis la racine du projet :

```bash
cd PharmaNatCI
npm install
ng serve
```

Application disponible sur : `http://localhost:4200`

---

## Structure du projet

```
PharmaNatCI/
├── pharmacienatci/            # Backend Django
│   ├── pharmacienatci/        # Configuration (settings, urls, wsgi)
│   ├── pharmacienatciapp/     # Application principale
│   │   ├── migrations/        # Migrations de base de données
│   │   ├── ml/                # Moteur de prévision (scikit-learn)
│   │   ├── models.py          # Modèles de données
│   │   ├── serializers.py     # Sérialiseurs DRF
│   │   ├── views.py           # Vues et endpoints API
│   │   └── urls.py            # Routes API
│   ├── media/                 # Fichiers uploadés (photos, images)
│   ├── manage.py
│   ├── requirements.txt       # Dépendances Python
│   └── .env                   # Variables d'environnement (non versionné)
│
└── PharmaNatCI/               # Frontend Angular
    ├── src/
    │   └── app/               # Composants, services, routes
    ├── angular.json
    └── package.json
```

---

## Configuration de la base de données

Le fichier `.env` utilise une seule variable `DATABASE_URL`. Les deux moteurs sont supportés :

| Moteur | Format de l'URL | Driver Python |
|--------|----------------|---------------|
| MySQL | `mysql://USER:PASSWORD@HOST:PORT/NOM_BD` | `mysqlclient` |
| PostgreSQL | `postgresql://USER:PASSWORD@HOST:PORT/NOM_BD` | `psycopg2-binary` |

Les deux drivers sont inclus dans `requirements.txt`, aucune installation supplémentaire n'est nécessaire.

---

## Commandes utiles

**Backend**

```bash
# Générer des migrations après modification des modèles
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Collecter les fichiers statiques (production)
python manage.py collectstatic
```

**Frontend**

```bash
# Build de production
ng build --configuration production

# Générer un composant
ng generate component nom-du-composant

# Lancer les tests
ng test
```
