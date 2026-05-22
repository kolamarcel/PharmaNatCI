from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Role, Region, Categorie, Fournisseur, Etablissement, Utilisateur,
    Medicament, Lot, Mouvement, Commande, LigneCommande, DemandeTransfert,
    Transfert, Notification, Retour, Prevision, Saison,
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('code', 'nom', 'description')
    search_fields = ('code', 'nom')


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'code')
    search_fields = ('nom', 'code')


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'actif')
    list_filter = ('actif',)
    search_fields = ('nom',)


@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom')
    search_fields = ('nom',)


@admin.register(Etablissement)
class EtablissementAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'type', 'region', 'actif')
    list_filter = ('type', 'actif', 'region')
    search_fields = ('nom', 'adresse', 'email')
    raw_id_fields = ('parent',)


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'email', 'role_entity', 'etablissement', 'is_staff', 'is_active')
    list_filter = ('role_entity', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'matricule')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations métier', {
            'fields': ('matricule', 'telephone', 'fonction', 'photo', 'role_entity', 'etablissement'),
        }),
        ('Notifications', {
            'fields': ('notif_rupture', 'notif_commande', 'notif_systeme'),
        }),
    )


@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'dci', 'nomCommercial', 'forme', 'dosage', 'categorie', 'actif')
    list_filter = ('actif', 'categorie', 'forme')
    search_fields = ('dci', 'nomCommercial', 'codeATC', 'laboratoire')


@admin.register(Lot)
class LotAdmin(admin.ModelAdmin):
    list_display = ('id', 'numeroLot', 'medicament', 'fournisseur', 'datePeremption', 'statut')
    list_filter = ('statut', 'fournisseur')
    search_fields = ('numeroLot', 'medicament__dci')
    date_hierarchy = 'datePeremption'


@admin.register(Mouvement)
class MouvementAdmin(admin.ModelAdmin):
    list_display = ('id', 'typeMouvement', 'medicament', 'etablissement', 'quantite', 'dateMouvement', 'statut')
    list_filter = ('typeMouvement', 'statut', 'etablissement')
    search_fields = ('reference', 'medicament__dci')
    date_hierarchy = 'dateMouvement'
    raw_id_fields = ('auteur', 'lot')


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    raw_id_fields = ('medicament',)


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'etablissement', 'fournisseur_etab', 'statut', 'urgente', 'progression', 'dateCreation')
    list_filter = ('statut', 'urgente')
    search_fields = ('id', 'etablissement__nom')
    date_hierarchy = 'dateCreation'
    inlines = [LigneCommandeInline]
    raw_id_fields = ('auteur',)


@admin.register(DemandeTransfert)
class DemandeTransfertAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicament', 'etablissementDemandeur', 'etablissementCible', 'quantiteDemandee', 'statut', 'urgence')
    list_filter = ('statut', 'urgence')
    search_fields = ('id', 'medicament__dci')
    date_hierarchy = 'dateDemande'


@admin.register(Transfert)
class TransfertAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicament', 'etablissementOrigine', 'etablissementDestination', 'quantite', 'statut', 'dateTransfert')
    list_filter = ('statut', 'urgence')
    search_fields = ('id', 'medicament__dci')
    date_hierarchy = 'dateTransfert'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'titre', 'destinataireRole', 'destinataireUtilisateur', 'lue', 'date')
    list_filter = ('lue', 'destinataireRole')
    search_fields = ('titre', 'message')
    date_hierarchy = 'date'


@admin.register(Retour)
class RetourAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicament', 'etablissement', 'lot', 'quantite', 'motif', 'statut', 'dateRetour')
    list_filter = ('statut', 'motif')
    search_fields = ('id', 'medicament__dci')
    date_hierarchy = 'dateRetour'


@admin.register(Prevision)
class PrevisionAdmin(admin.ModelAdmin):
    list_display = ('id', 'medicament', 'mois', 'niveau', 'etablissement', 'demandePrevue', 'risqueRupture', 'recommandationCommande')
    list_filter = ('niveau', 'risqueRupture', 'recommandationCommande', 'recommandationTransfert')
    search_fields = ('medicament__dci', 'mois')
    date_hierarchy = 'dateFocalisation'


@admin.register(Saison)
class SaisonAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'region', 'mois', 'actif')
    list_filter = ('actif', 'region')
    search_fields = ('nom',)
