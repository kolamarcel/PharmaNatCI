from django.db import models
from django.contrib.auth.models import AbstractUser

class Role(models.Model):
    code = models.CharField(max_length=50, primary_key=True) # supervisor_national, etc.
    nom = models.CharField(max_length=100, default="Role")
    description = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.code

class Region(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, null=True, blank=True)
    
    def __str__(self):
        return self.nom

class Categorie(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=100)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom

class Fournisseur(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nom

class Etablissement(models.Model):
    TYPE_CHOICES = [
        ('PHARMACIE', 'Pharmacie'),
        ('REGION', 'Région'),
        ('NATIONAL', 'National'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='etablissements', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='enfants')
    adresse = models.TextField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    telephone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    photo = models.ImageField(upload_to='etablissements/', null=True, blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom

class Utilisateur(AbstractUser):
    # AbstractUser already has username, password, email, first_name, last_name, is_active, etc.
    id = models.CharField(max_length=50, primary_key=True)
    matricule = models.CharField(max_length=50, unique=True, null=True, blank=True)
    telephone = models.CharField(max_length=20, null=True, blank=True)
    fonction = models.CharField(max_length=100, null=True, blank=True)
    photo = models.ImageField(upload_to='utilisateurs/', null=True, blank=True)
    role_entity = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True) # Linked to our Role model
    etablissement = models.ForeignKey(Etablissement, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Préférences de notification
    notif_rupture = models.BooleanField(default=True)
    notif_commande = models.BooleanField(default=True)
    notif_systeme = models.BooleanField(default=False)

    # We'll use 'role_entity' for the MCD roles and Django's group/permissions for system roles
    
    def __str__(self):
        return self.username

class Medicament(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    dci = models.CharField(max_length=255)
    nomCommercial = models.CharField(max_length=255)
    forme = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100)
    codeATC = models.CharField(max_length=50, null=True, blank=True)
    unite = models.CharField(max_length=50, null=True, blank=True, default="N/A")
    seuilMin = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuilAlerte = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    laboratoire = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    prixUnitaire = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    image = models.ImageField(upload_to='medicaments/', null=True, blank=True)
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE, related_name='medicaments')
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.dci

class Lot(models.Model):
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('expire', 'Expiré'),
        ('rappel', 'Rappel'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE, related_name='lots')
    numeroLot = models.CharField(max_length=100)
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.CASCADE, related_name='lots')
    dateFabrication = models.DateField()
    datePeremption = models.DateField()
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='actif')
    
    def __str__(self):
        return f"{self.numeroLot} - {self.medicament.dci}"

class Mouvement(models.Model):
    TYPE_MOUVEMENT_CHOICES = [
        ('ENTREE', 'Entrée'),
        ('SORTIE', 'Sortie'),
        ('DESTRUCTION', 'Destruction'),
        ('AJUSTEMENT', 'Ajustement'),
    ]
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE)
    lot = models.ForeignKey(Lot, on_delete=models.CASCADE)
    typeMouvement = models.CharField(max_length=20, choices=TYPE_MOUVEMENT_CHOICES)
    quantite = models.DecimalField(max_digits=15, decimal_places=2)
    dateMouvement = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(max_length=100)
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)
    motif = models.CharField(max_length=255, null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='valide')

class Commande(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='commandes_faites')
    fournisseur_etab = models.ForeignKey(Etablissement, on_delete=models.SET_NULL, null=True, blank=True, related_name='commandes_recues')
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)
    dateCreation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=100)
    urgente = models.BooleanField(default=False)
    progression = models.IntegerField(default=0)

class LigneCommande(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE)
    quantite = models.DecimalField(max_digits=15, decimal_places=2)

class DemandeTransfert(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    etablissementDemandeur = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='demandes_transfert_emises')
    etablissementCible = models.ForeignKey(Etablissement, on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes_transfert_recues')
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE)
    quantiteDemandee = models.DecimalField(max_digits=15, decimal_places=2)
    quantiteSatisfaite = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    statut = models.CharField(max_length=50)
    dateDemande = models.DateTimeField(auto_now_add=True)
    urgence = models.CharField(max_length=20)

class Transfert(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    etablissementOrigine = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='transferts_expedies')
    etablissementDestination = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='transferts_recus')
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE)
    quantite = models.DecimalField(max_digits=15, decimal_places=2)
    statut = models.CharField(max_length=50)
    urgence = models.CharField(max_length=20)
    dateTransfert = models.DateTimeField(auto_now_add=True)
    demandeTransfert = models.ForeignKey(DemandeTransfert, on_delete=models.SET_NULL, null=True, blank=True)

class Notification(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    titre = models.CharField(max_length=255)
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)
    destinataireRole = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    destinataireUtilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)

class Retour(models.Model):
    MOTIF_CHOICES = [
        ('Avarie', 'Avarie'),
        ('Non-conformité', 'Non-conformité'),
        ('Péremption', 'Péremption'),
        ('Rappel', 'Rappel'),
    ]
    STATUT_CHOICES = [
        ('En attente', 'En attente'),
        ('Approuvé', 'Approuvé'),
        ('Rejeté', 'Rejeté'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='retours')
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE, related_name='retours')
    lot = models.ForeignKey(Lot, on_delete=models.CASCADE, related_name='retours')
    quantite = models.DecimalField(max_digits=15, decimal_places=2)
    motif = models.CharField(max_length=50, choices=MOTIF_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En attente')
    dateRetour = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Retour {self.id} - {self.medicament.dci}"

class Saison(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=100) # ex: "Saison Pluvieuse", "Forte demande Palu"
    mois = models.JSONField(default=list)  # ex: [5, 6, 7, 8, 9] -> Entiers de 1 à 12
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='saisons')
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nom} ({self.mois})"
