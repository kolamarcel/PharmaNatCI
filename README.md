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
```

---

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

```bash
pip install -r requirements.txt
```

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

```bash
python manage.py createsuperuser
```

---

# 14. Lancer le serveur Django

```bash
python manage.py runserver
```

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
npm install
ng serve
```

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
```
