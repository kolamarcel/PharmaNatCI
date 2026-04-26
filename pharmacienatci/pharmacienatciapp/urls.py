from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Authentification
    path('auth/login/', views.auth_login, name='login'),
    path('auth/logout/', views.auth_logout, name='logout'),
    path('auth/profile/', views.auth_profile, name='profile'),
    path('auth/change-password/', views.api_changer_mot_de_passe),

    # Region
    path('regions/', views.api_region_liste),
    path('regions/ajouter/', views.api_region_ajout),
    path('regions/<str:pk>/', views.api_region_lecture),
    path('regions/<str:pk>/modifier/', views.api_region_modifier),
    path('regions/<str:pk>/supprimer/', views.api_region_supprimer),

    # Role
    path('roles/', views.api_role_liste),
    path('roles/ajouter/', views.api_role_ajout),
    path('roles/<str:pk>/', views.api_role_lecture),
    path('roles/<str:pk>/modifier/', views.api_role_modifier),
    path('roles/<str:pk>/supprimer/', views.api_role_supprimer),

    # Categorie
    path('categories/', views.api_categorie_liste),
    path('categories/ajouter/', views.api_categorie_ajout),
    path('categories/<str:pk>/', views.api_categorie_lecture),
    path('categories/<str:pk>/modifier/', views.api_categorie_modifier),
    path('categories/<str:pk>/supprimer/', views.api_categorie_supprimer),

    # Fournisseur
    path('fournisseurs/', views.api_fournisseur_liste),
    path('fournisseurs/ajouter/', views.api_fournisseur_ajout),
    path('fournisseurs/<str:pk>/', views.api_fournisseur_lecture),
    path('fournisseurs/<str:pk>/modifier/', views.api_fournisseur_modifier),
    path('fournisseurs/<str:pk>/supprimer/', views.api_fournisseur_supprimer),

    # Etablissement
    path('etablissements/', views.api_etablissement_liste),
    path('etablissements/ajouter/', views.api_etablissement_ajout),
    path('etablissements/<str:pk>/', views.api_etablissement_lecture),
    path('etablissements/<str:pk>/modifier/', views.api_etablissement_modifier),
    path('etablissements/<str:pk>/supprimer/', views.api_etablissement_supprimer),

    # Utilisateur
    path('utilisateurs/', views.api_utilisateur_liste),
    path('utilisateurs/ajouter/', views.api_utilisateur_ajout),
    path('utilisateurs/<str:pk>/', views.api_utilisateur_lecture),
    path('utilisateurs/<str:pk>/modifier/', views.api_utilisateur_modifier),
    path('utilisateurs/<str:pk>/supprimer/', views.api_utilisateur_supprimer),

    # Medicament
    path('medicaments/', views.api_medicament_liste),
    path('medicaments/ajouter/', views.api_medicament_ajout),
    path('medicaments/<str:pk>/', views.api_medicament_lecture),
    path('medicaments/<str:pk>/modifier/', views.api_medicament_modifier),
    path('medicaments/<str:pk>/supprimer/', views.api_medicament_supprimer),

    # Lot
    path('lots/', views.api_lot_liste),
    path('lots/ajouter/', views.api_lot_ajout),
    path('lots/<str:pk>/', views.api_lot_lecture),
    path('lots/<str:pk>/modifier/', views.api_lot_modifier),
    path('lots/<str:pk>/supprimer/', views.api_lot_supprimer),

    # Mouvement
    path('mouvements/', views.api_mouvement_liste),
    path('mouvements/ajouter/', views.api_mouvement_ajout),
    path('mouvements/<str:pk>/', views.api_mouvement_lecture),
    path('mouvements/<str:pk>/modifier/', views.api_mouvement_modifier),
    path('mouvements/<str:pk>/supprimer/', views.api_mouvement_supprimer),

    # Commande
    path('commandes/', views.api_commande_liste),
    path('commandes/ajouter/', views.api_commande_ajout),
    path('commandes/<str:pk>/', views.api_commande_lecture),
    path('commandes/<str:pk>/modifier/', views.api_commande_modifier),
    path('commandes/<str:pk>/supprimer/', views.api_commande_supprimer),

    # LigneCommande
    path('lignes-commande/', views.api_ligne_commande_liste),
    path('lignes-commande/ajouter/', views.api_ligne_commande_ajout),
    path('lignes-commande/<str:pk>/', views.api_ligne_commande_lecture),
    path('lignes-commande/<str:pk>/modifier/', views.api_ligne_commande_modifier),
    path('lignes-commande/<str:pk>/supprimer/', views.api_ligne_commande_supprimer),

    # DemandeTransfert
    path('demandes-transfert/', views.api_demande_transfert_liste),
    path('demandes-transfert/ajouter/', views.api_demande_transfert_ajout),
    path('demandes-transfert/<str:pk>/', views.api_demande_transfert_lecture),
    path('demandes-transfert/<str:pk>/modifier/', views.api_demande_transfert_modifier),
    path('demandes-transfert/<str:pk>/supprimer/', views.api_demande_transfert_supprimer),

    # Transfert
    path('transferts/', views.api_transfert_liste),
    path('transferts/ajouter/', views.api_transfert_ajout),
    path('transferts/<str:pk>/', views.api_transfert_lecture),
    path('transferts/<str:pk>/modifier/', views.api_transfert_modifier),
    path('transferts/<str:pk>/supprimer/', views.api_transfert_supprimer),

    # Notification
    path('notifications/', views.api_notification_liste),
    path('notifications/ajouter/', views.api_notification_ajout),
    path('notifications/<str:pk>/', views.api_notification_lecture),
    path('notifications/<str:pk>/modifier/', views.api_notification_modifier),
    path('notifications/<str:pk>/supprimer/', views.api_notification_supprimer),

    # Retour
    path('retours/', views.api_retour_liste),
    path('retours/ajouter/', views.api_retour_ajout),
    path('retours/<str:pk>/', views.api_retour_lecture),
    path('retours/<str:pk>/modifier/', views.api_retour_modifier),
    path('retours/<str:pk>/supprimer/', views.api_retour_supprimer),

    # Saison
    path('saisons/', views.api_saison_liste),
    path('saisons/ajouter/', views.api_saison_ajout),
    path('saisons/<str:pk>/', views.api_saison_lecture),
    path('saisons/<str:pk>/modifier/', views.api_saison_modifier),
    path('saisons/<str:pk>/supprimer/', views.api_saison_supprimer),

    # Actions Spéciales
    path('lots/<str:pk>/rappel/', views.api_lot_rappel),
    path('commandes/<str:pk>/avancer/', views.api_commande_avancer),
    path('demandes-transfert/<str:pk>/repondre/', views.api_demande_repondre),
    path('notifications/marquer_lues/', views.api_notifications_marquer_lues),
    path('dashboard/stats/', views.api_dashboard_stats),


]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
