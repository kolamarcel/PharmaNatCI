from django.contrib import admin
<<<<<<< HEAD

# Register your models here.
=======
from unfold.admin import ModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Role, Region, Categorie, Fournisseur, Etablissement, Utilisateur,
    Medicament, Lot, Mouvement, Commande, LigneCommande, DemandeTransfert,
    Transfert, Notification, Retour, Prevision, Saison
)

@admin.register(Utilisateur)
class UtilisateurAdmin(BaseUserAdmin, ModelAdmin):
    list_display = ("username", "email", "first_name", "last_name", "fonction", "role_entity", "etablissement", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name", "matricule", "fonction")
    list_filter = ("is_staff", "is_superuser", "is_active", "role_entity")
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations Supplémentaires', {'fields': ('id', 'matricule', 'telephone', 'fonction', 'photo', 'role_entity', 'etablissement')}),
        ('Préférences de notification', {'fields': ('notif_rupture', 'notif_commande', 'notif_systeme')}),
    )

@admin.register(Role)
class RoleAdmin(ModelAdmin):
    list_display = ("code", "nom")
    search_fields = ("code", "nom")

@admin.register(Region)
class RegionAdmin(ModelAdmin):
    list_display = ("id", "nom", "code")
    search_fields = ("nom", "code")

@admin.register(Categorie)
class CategorieAdmin(ModelAdmin):
    list_display = ("id", "nom", "actif")
    list_filter = ("actif",)
    search_fields = ("nom",)

@admin.register(Fournisseur)
class FournisseurAdmin(ModelAdmin):
    list_display = ("id", "nom")
    search_fields = ("nom",)

@admin.register(Etablissement)
class EtablissementAdmin(ModelAdmin):
    list_display = ("nom", "type", "region", "parent", "actif")
    list_filter = ("type", "actif", "region")
    search_fields = ("nom", "adresse", "email", "telephone")

@admin.register(Medicament)
class MedicamentAdmin(ModelAdmin):
    list_display = ("dci", "nomCommercial", "forme", "dosage", "categorie", "laboratoire", "actif")
    list_filter = ("categorie", "actif", "forme")
    search_fields = ("dci", "nomCommercial", "laboratoire", "codeATC")

@admin.register(Lot)
class LotAdmin(ModelAdmin):
    list_display = ("numeroLot", "medicament", "fournisseur", "dateFabrication", "datePeremption", "statut")
    list_filter = ("statut", "fournisseur")
    search_fields = ("numeroLot", "medicament__dci")

@admin.register(Mouvement)
class MouvementAdmin(ModelAdmin):
    list_display = ("reference", "typeMouvement", "medicament", "etablissement", "quantite", "dateMouvement", "statut")
    list_filter = ("typeMouvement", "statut", "etablissement")
    search_fields = ("reference", "medicament__dci", "motif")

class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 1

@admin.register(Commande)
class CommandeAdmin(ModelAdmin):
    list_display = ("id", "etablissement", "fournisseur_etab", "auteur", "dateCreation", "statut", "urgente")
    list_filter = ("statut", "urgente", "etablissement")
    search_fields = ("id",)
    inlines = [LigneCommandeInline]

@admin.register(DemandeTransfert)
class DemandeTransfertAdmin(ModelAdmin):
    list_display = ("id", "etablissementDemandeur", "etablissementCible", "medicament", "quantiteDemandee", "statut", "urgence")
    list_filter = ("statut", "urgence")
    search_fields = ("id", "medicament__dci")

@admin.register(Transfert)
class TransfertAdmin(ModelAdmin):
    list_display = ("id", "etablissementOrigine", "etablissementDestination", "medicament", "quantite", "statut", "urgence")
    list_filter = ("statut", "urgence")
    search_fields = ("id", "medicament__dci")

@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ("titre", "date", "lue", "destinataireRole", "destinataireUtilisateur")
    list_filter = ("lue", "date")
    search_fields = ("titre", "message")

@admin.register(Retour)
class RetourAdmin(ModelAdmin):
    list_display = ("id", "etablissement", "medicament", "quantite", "motif", "statut", "dateRetour")
    list_filter = ("motif", "statut")
    search_fields = ("id", "medicament__dci")

@admin.register(Prevision)
class PrevisionAdmin(ModelAdmin):
    list_display = ("medicament", "mois", "niveau", "demandePrevue", "risqueRupture")
    list_filter = ("niveau", "risqueRupture", "mois")
    search_fields = ("medicament__dci",)

@admin.register(Saison)
class SaisonAdmin(ModelAdmin):
    list_display = ("nom", "region", "actif")
    list_filter = ("actif", "region")
    search_fields = ("nom",)
>>>>>>> 1a8a7c0 (2e commit)
