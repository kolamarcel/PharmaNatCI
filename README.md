<<<<<<< HEAD
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
=======
````md
# Guide Complet : Cloner et Lancer un Projet Angular et Django depuis GitHub

---

# PARTIE 1 — PROJET ANGULAR

## 1. Installer les prérequis

### Installer Git

Téléchargement :
https://git-scm.com

Vérification :

```bash
git --version
````

---

### Installer Node.js

Téléchargement :
[https://nodejs.org](https://nodejs.org)

Vérification :

```bash
node -v
npm -v
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
```

---

<<<<<<< HEAD
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
=======
### Installer Angular CLI

Installation globale :

```bash
npm install -g @angular/cli
```

Vérification :

```bash
ng version
```

---

# 2. Cloner le projet Angular

## Copier l’URL GitHub

Exemple :

```bash
https://github.com/utilisateur/projet-angular.git
```

---

## Cloner le dépôt

```bash
git clone https://github.com/utilisateur/projet-angular.git
```

---

# 3. Entrer dans le dossier

```bash
cd projet-angular
```

---

# 4. Installer les dépendances

```bash
npm install
```

Si erreur :

```bash
npm install --legacy-peer-deps
```

ou :

```bash
npm install --force
```

---

# 5. Lancer le projet Angular

```bash
ng serve
```

ou :

```bash
npm start
```

---

# 6. Accéder au projet

Ouvrir :

```text
http://localhost:4200
```

---

# 7. Structure typique Angular

```text
src/
 ├── app/
 ├── assets/
 ├── environments/
 ├── index.html
 └── main.ts
```

---

# 8. Vérifier la version Angular

Dans :

```text
package.json
```

Exemple :

```json
"@angular/core": "^17.0.0"
```

---

# 9. Utiliser la bonne version Angular CLI

Installer une version spécifique :

```bash
npm install -g @angular/cli@17
```

Ou utiliser la version locale :

```bash
npx ng serve
```

---

# 10. Commandes Angular utiles

## Générer un composant

```bash
ng generate component nom
```

ou :

```bash
ng g c nom
```

---

## Build production

```bash
ng build --configuration production
```

Résultat :

```text
dist/
```

---

# 11. Supprimer et réinstaller node_modules

## Linux/Mac

```bash
rm -rf node_modules package-lock.json
npm install
```

## Windows CMD

```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

# 12. Vérifier les scripts npm

Dans :

```text
package.json
```

Exemple :

```json
"scripts": {
  "start": "ng serve"
}
```

---

# 13. Utiliser VS Code

Téléchargement :
[https://code.visualstudio.com](https://code.visualstudio.com)

Ouvrir le projet :

```bash
code .
```

---

# 14. Git : branches et mise à jour

## Voir les branches

```bash
git branch
```

---

## Changer de branche

```bash
git checkout nom-branche
```

---

## Mettre à jour le projet

```bash
git pull
```

---

## Envoyer des modifications

```bash
git add .
git commit -m "modification"
git push
```

---

# PARTIE 2 — PROJET DJANGO

---

# 1. Installer Python

Téléchargement :
[https://www.python.org](https://www.python.org)

Vérification :

```bash
python --version
```

ou :

```bash
python3 --version
```

---

# 2. Installer pip

Vérification :

```bash
pip --version
```

---

# 3. Installer Git

```bash
git --version
```

---

# 4. Cloner le projet Django

```bash
git clone https://github.com/utilisateur/projet-django.git
```

---

# 5. Entrer dans le dossier

```bash
cd projet-django
```

---

# 6. Créer un environnement virtuel

## Windows

```bash
python -m venv venv
```

## Linux/Mac

```bash
python3 -m venv venv
```

---

# 7. Activer l’environnement virtuel

## Windows CMD

```cmd
venv\Scripts\activate
```

## Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

## Linux/Mac

```bash
source venv/bin/activate
```

---

# 8. Installer les dépendances

## Avec requirements.txt
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13

```bash
pip install -r requirements.txt
```

<<<<<<< HEAD
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
=======
---

# 9. Installer Django si nécessaire

```bash
pip install django
```

---

# 10. Vérifier Django

```bash
python manage.py --version
```

---

# 11. Vérifier la configuration base de données

Dans :

```text
settings.py
```

Exemple SQLite :

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

---

# 12. Faire les migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

# 13. Créer un super utilisateur
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13

```bash
python manage.py createsuperuser
```

<<<<<<< HEAD
**Lancer le serveur**
=======
---

# 14. Lancer le serveur Django
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13

```bash
python manage.py runserver
```

<<<<<<< HEAD
API disponible sur : `http://127.0.0.1:8000/api/`
Interface admin : `http://127.0.0.1:8000/admin/`

---

### 3. Frontend Angular

Dans un nouveau terminal, depuis la racine du projet :

```bash
cd PharmaNatCI
=======
---

# 15. Accéder au projet Django

```text
http://127.0.0.1:8000
```

Admin :

```text
http://127.0.0.1:8000/admin
```

---

# 16. Structure typique Django

```text
projet/
 ├── manage.py
 ├── requirements.txt
 ├── app/
 ├── media/
 ├── static/
 └── projet/
      ├── settings.py
      ├── urls.py
      ├── wsgi.py
      └── asgi.py
```

---

# 17. Installer PostgreSQL

Téléchargement :
[https://www.postgresql.org](https://www.postgresql.org)

Installer le driver :

```bash
pip install psycopg2
```

Configuration :

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'nom_db',
        'USER': 'postgres',
        'PASSWORD': 'motdepasse',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

# 18. Installer MySQL

Driver :

```bash
pip install mysqlclient
```

Configuration :

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'nom_db',
        'USER': 'root',
        'PASSWORD': 'motdepasse',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

---

# 19. Collecter les fichiers statiques

```bash
python manage.py collectstatic
```

---

# 20. Créer requirements.txt

```bash
pip freeze > requirements.txt
```

---

# 21. Désactiver l’environnement virtuel

```bash
deactivate
```

---

# 22. Workflow complet Angular

```bash
git clone URL
cd projet-angular
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
npm install
ng serve
```

<<<<<<< HEAD
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
=======
---

# 23. Workflow complet Django

```bash
git clone URL
cd projet-django

python -m venv venv

# Activation Windows
venv\Scripts\activate

# Activation Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate

python manage.py runserver
```

---

# 24. Workflow Angular + Django

## Terminal 1 : Backend Django

```bash
cd backend
python manage.py runserver
```

---

## Terminal 2 : Frontend Angular

```bash
cd frontend
ng serve
```

---

# 25. URLs par défaut

## Angular

```text
http://localhost:4200
```

## Django

```text
http://127.0.0.1:8000
```

---

# 26. Erreurs fréquentes

## Erreur npm

```bash
npm install --legacy-peer-deps
```

---

## Erreur Python package

```bash
pip install nom_package
```

---

## Erreur migrations

```bash
python manage.py migrate --run-syncdb
```

---

# 27. Bonnes pratiques

* Toujours utiliser un environnement virtuel Python
* Toujours utiliser `.gitignore`
* Toujours utiliser `requirements.txt`
* Toujours vérifier `package.json`
* Toujours vérifier `.env`
* Ne jamais pousser `node_modules`
* Ne jamais pousser `venv`

---

# 28. Fichiers importants

## Angular

```text
package.json
angular.json
tsconfig.json
environment.ts
```

## Django

```text
settings.py
urls.py
requirements.txt
manage.py
```

---

```
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
```
