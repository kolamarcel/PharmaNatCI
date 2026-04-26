from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
import uuid
import datetime
from django.db.models import Sum, Count, Q, F
from .models import (
    Region, Role, Categorie, Fournisseur, Etablissement, 
    Utilisateur, Medicament, Lot, Mouvement, Commande, 
    LigneCommande, DemandeTransfert, Transfert, Notification,
    Retour, Saison
)
from .serializers import (
    RegionSerializer, RoleSerializer, CategorieSerializer, FournisseurSerializer, 
    EtablissementSerializer, UtilisateurSerializer, MedicamentSerializer, 
    LotSerializer, MouvementSerializer, CommandeSerializer, LigneCommandeSerializer, 
    DemandeTransfertSerializer, TransfertSerializer, NotificationSerializer,
    RetourSerializer, SaisonSerializer
)

# --- Authentification ---

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        response = Response({
            "message": "Login successful",
            "user": UtilisateurSerializer(user).data
        }, status=status.HTTP_200_OK)
        
        response.set_cookie(key=settings.JWT_COOKIE_NAME, value=str(refresh.access_token), httponly=settings.JWT_COOKIE_HTTPONLY, secure=settings.JWT_COOKIE_SECURE, samesite=settings.JWT_COOKIE_SAMESITE, max_age=3600)
        response.set_cookie(key=settings.JWT_REFRESH_COOKIE_NAME, value=str(refresh), httponly=settings.JWT_COOKIE_HTTPONLY, secure=settings.JWT_COOKIE_SECURE, samesite=settings.JWT_COOKIE_SAMESITE, max_age=86400)
        return response
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def auth_logout(request):
    response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
    response.delete_cookie(settings.JWT_COOKIE_NAME)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME)
    return response

@api_view(['GET', 'PATCH'])
def auth_profile(request):
    if request.method == 'GET':
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UtilisateurSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def api_changer_mot_de_passe(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not user.check_password(old_password):
        return Response({"error": "L'ancien mot de passe est incorrect."}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    return Response({"message": "Mot de passe mis à jour avec succès."})


# --- Fonctions CRUD Individuelles (Option B) ---

# --- Region ---

@api_view(['GET'])
def api_region_liste(request):
    """Liste les Regions"""
    queryset = Region.objects.all()
    serializer = RegionSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_region_ajout(request):
    """Ajoute un Region"""
    serializer = RegionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_region_lecture(request, pk):
    """Détail d'un Region"""
    instance = get_object_or_404(Region, pk=pk)
    return Response(RegionSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_region_modifier(request, pk):
    """Modifie un Region"""
    instance = get_object_or_404(Region, pk=pk)
    serializer = RegionSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_region_supprimer(request, pk):
    """Supprime un Region"""
    instance = get_object_or_404(Region, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Role ---

@api_view(['GET'])
def api_role_liste(request):
    """Liste les Roles"""
    queryset = Role.objects.all()
    serializer = RoleSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_role_ajout(request):
    """Ajoute un Role"""
    serializer = RoleSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_role_lecture(request, pk):
    """Détail d'un Role"""
    instance = get_object_or_404(Role, pk=pk)
    return Response(RoleSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_role_modifier(request, pk):
    """Modifie un Role"""
    instance = get_object_or_404(Role, pk=pk)
    serializer = RoleSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_role_supprimer(request, pk):
    """Supprime un Role"""
    instance = get_object_or_404(Role, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Categorie ---

@api_view(['GET'])
def api_categorie_liste(request):
    """Liste les Categories"""
    queryset = Categorie.objects.all()
    serializer = CategorieSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_categorie_ajout(request):
    """Ajoute un Categorie"""
    serializer = CategorieSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_categorie_lecture(request, pk):
    """Détail d'un Categorie"""
    instance = get_object_or_404(Categorie, pk=pk)
    return Response(CategorieSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_categorie_modifier(request, pk):
    """Modifie un Categorie"""
    instance = get_object_or_404(Categorie, pk=pk)
    serializer = CategorieSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_categorie_supprimer(request, pk):
    """Supprime un Categorie"""
    instance = get_object_or_404(Categorie, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Fournisseur ---

@api_view(['GET'])
def api_fournisseur_liste(request):
    """Liste les Fournisseurs"""
    queryset = Fournisseur.objects.all()
    serializer = FournisseurSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_fournisseur_ajout(request):
    """Ajoute un Fournisseur"""
    serializer = FournisseurSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_fournisseur_lecture(request, pk):
    """Détail d'un Fournisseur"""
    instance = get_object_or_404(Fournisseur, pk=pk)
    return Response(FournisseurSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_fournisseur_modifier(request, pk):
    """Modifie un Fournisseur"""
    instance = get_object_or_404(Fournisseur, pk=pk)
    serializer = FournisseurSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_fournisseur_supprimer(request, pk):
    """Supprime un Fournisseur"""
    instance = get_object_or_404(Fournisseur, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Etablissement ---

@api_view(['GET'])
def api_etablissement_liste(request):
    """Liste les Etablissements"""
    queryset = Etablissement.objects.all()
    serializer = EtablissementSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_etablissement_ajout(request):
    """Ajoute un Etablissement"""
    serializer = EtablissementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_etablissement_lecture(request, pk):
    """Détail d'un Etablissement"""
    instance = get_object_or_404(Etablissement, pk=pk)
    return Response(EtablissementSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_etablissement_modifier(request, pk):
    """Modifie un Etablissement"""
    instance = get_object_or_404(Etablissement, pk=pk)
    serializer = EtablissementSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_etablissement_supprimer(request, pk):
    """Supprime un Etablissement"""
    instance = get_object_or_404(Etablissement, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Utilisateur ---

@api_view(['GET'])
def api_utilisateur_liste(request):
    """Liste les Utilisateurs"""
    queryset = Utilisateur.objects.all()
    serializer = UtilisateurSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_utilisateur_ajout(request):
    """Ajoute un Utilisateur"""
    serializer = UtilisateurSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_utilisateur_lecture(request, pk):
    """Détail d'un Utilisateur"""
    instance = get_object_or_404(Utilisateur, pk=pk)
    return Response(UtilisateurSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_utilisateur_modifier(request, pk):
    """Modifie un Utilisateur"""
    instance = get_object_or_404(Utilisateur, pk=pk)
    serializer = UtilisateurSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_utilisateur_supprimer(request, pk):
    """Supprime un Utilisateur"""
    instance = get_object_or_404(Utilisateur, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Medicament ---

@api_view(['GET'])
def api_medicament_liste(request):
    """Liste les Medicaments"""
    queryset = Medicament.objects.all()
    serializer = MedicamentSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_medicament_ajout(request):
    """Ajoute un Medicament"""
    serializer = MedicamentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_medicament_lecture(request, pk):
    """Détail d'un Medicament"""
    instance = get_object_or_404(Medicament, pk=pk)
    return Response(MedicamentSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_medicament_modifier(request, pk):
    """Modifie un Medicament"""
    instance = get_object_or_404(Medicament, pk=pk)
    serializer = MedicamentSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_medicament_supprimer(request, pk):
    """Supprime un Medicament"""
    instance = get_object_or_404(Medicament, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Lot ---

@api_view(['GET'])
def api_lot_liste(request):
    """Liste les Lots"""
    queryset = Lot.objects.all()
    serializer = LotSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_lot_ajout(request):
    """Ajoute un Lot"""
    serializer = LotSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_lot_lecture(request, pk):
    """Détail d'un Lot"""
    instance = get_object_or_404(Lot, pk=pk)
    return Response(LotSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_lot_modifier(request, pk):
    """Modifie un Lot"""
    instance = get_object_or_404(Lot, pk=pk)
    serializer = LotSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_lot_supprimer(request, pk):
    """Supprime un Lot"""
    instance = get_object_or_404(Lot, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Mouvement ---

@api_view(['GET'])
def api_mouvement_liste(request):
    """Liste les Mouvements"""
    queryset = Mouvement.objects.all()
    serializer = MouvementSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_mouvement_ajout(request):
    """Ajoute un Mouvement"""
    serializer = MouvementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_mouvement_lecture(request, pk):
    """Détail d'un Mouvement"""
    instance = get_object_or_404(Mouvement, pk=pk)
    return Response(MouvementSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_mouvement_modifier(request, pk):
    """Modifie un Mouvement"""
    instance = get_object_or_404(Mouvement, pk=pk)
    serializer = MouvementSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_mouvement_supprimer(request, pk):
    """Supprime un Mouvement"""
    instance = get_object_or_404(Mouvement, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Commande ---

@api_view(['GET'])
def api_commande_liste(request):
    """Liste les Commandes"""
    queryset = Commande.objects.all()
    serializer = CommandeSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_commande_ajout(request):
    """Ajoute un Commande"""
    serializer = CommandeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_commande_lecture(request, pk):
    """Détail d'un Commande"""
    instance = get_object_or_404(Commande, pk=pk)
    return Response(CommandeSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_commande_modifier(request, pk):
    """Modifie un Commande"""
    instance = get_object_or_404(Commande, pk=pk)
    serializer = CommandeSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_commande_supprimer(request, pk):
    """Supprime un Commande"""
    instance = get_object_or_404(Commande, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- LigneCommande ---

@api_view(['GET'])
def api_ligne_commande_liste(request):
    """Liste les LigneCommandes"""
    queryset = LigneCommande.objects.all()
    serializer = LigneCommandeSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_ligne_commande_ajout(request):
    """Ajoute un LigneCommande"""
    serializer = LigneCommandeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_ligne_commande_lecture(request, pk):
    """Détail d'un LigneCommande"""
    instance = get_object_or_404(LigneCommande, pk=pk)
    return Response(LigneCommandeSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_ligne_commande_modifier(request, pk):
    """Modifie un LigneCommande"""
    instance = get_object_or_404(LigneCommande, pk=pk)
    serializer = LigneCommandeSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_ligne_commande_supprimer(request, pk):
    """Supprime un LigneCommande"""
    instance = get_object_or_404(LigneCommande, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- DemandeTransfert ---

@api_view(['GET'])
def api_demande_transfert_liste(request):
    """Liste les DemandeTransferts"""
    queryset = DemandeTransfert.objects.all()
    serializer = DemandeTransfertSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_demande_transfert_ajout(request):
    """Ajoute un DemandeTransfert"""
    serializer = DemandeTransfertSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_demande_transfert_lecture(request, pk):
    """Détail d'un DemandeTransfert"""
    instance = get_object_or_404(DemandeTransfert, pk=pk)
    return Response(DemandeTransfertSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_demande_transfert_modifier(request, pk):
    """Modifie un DemandeTransfert"""
    instance = get_object_or_404(DemandeTransfert, pk=pk)
    serializer = DemandeTransfertSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_demande_transfert_supprimer(request, pk):
    """Supprime un DemandeTransfert"""
    instance = get_object_or_404(DemandeTransfert, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Transfert ---

@api_view(['GET'])
def api_transfert_liste(request):
    """Liste les Transferts"""
    queryset = Transfert.objects.all()
    serializer = TransfertSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_transfert_ajout(request):
    """Ajoute un Transfert"""
    serializer = TransfertSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_transfert_lecture(request, pk):
    """Détail d'un Transfert"""
    instance = get_object_or_404(Transfert, pk=pk)
    return Response(TransfertSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_transfert_modifier(request, pk):
    """Modifie un Transfert avec traçabilité et robustesse accrue."""
    instance = get_object_or_404(Transfert, pk=pk)
    old_statut = instance.statut
    
    serializer = TransfertSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        transfert = serializer.save()
        
        # --- NORMALISATION ET DIAGNOSTIC ---
        target_statut = str(transfert.statut).strip().lower()
        ref_transfert = f"TR-{transfert.id}"
        traces = []
        
        # 1. EXPÉDITION (SORTIE) - Désactivé ici selon instruction (le stock ne change pas à l'expédition)
        if target_statut in ['expédié', 'expedie', 'shipped']:
            traces.append("Transfert expédié. Le mouvement de stock sera créé à la réception.")
            # On envoie tout de même la notification
            try:
                Notification.objects.create(
                    id=f"NOT-TR-AD-{uuid.uuid4().hex[:10]}",
                    titre="Avis d'expédition",
                    message=f"Le transfert {transfert.id} ({transfert.medicament.dci}) est expédié vers {transfert.etablissementDestination.nom}.",
                    destinataireRole=None,
                    destinataireUtilisateur=None
                )
            except: pass
        
        # 2. RÉCEPTION (LIVRÉ) -> DÉCLENCHE TOUS LES MOUVEMENTS (SORTIE + ENTRÉE)
        if target_statut in ['livré', 'livre', 'received']:
            try:
                import uuid
                default_fournisseur = Fournisseur.objects.filter(id="f1").first() or Fournisseur.objects.first()
                lot = Lot.objects.filter(medicament=transfert.medicament, statut='actif').first() or \
                      Lot.objects.filter(medicament=transfert.medicament).first()
                
                if not lot:
                    lot = Lot.objects.create(
                        id=f"LOT-AT-{uuid.uuid4().hex[:8]}",
                        medicament=transfert.medicament,
                        numeroLot=f"L-TR-AUTO-{transfert.id[:6]}",
                        fournisseur=default_fournisseur,
                        dateFabrication=datetime.date.today(),
                        datePeremption=datetime.date.today() + datetime.timedelta(days=365),
                        statut='actif'
                    )

                # A. CRÉATION DE LA SORTIE (Pour l'Origine) - Si elle n'existe pas déjà
                if not Mouvement.objects.filter(reference=ref_transfert, typeMouvement='SORTIE').exists():
                    Mouvement.objects.create(
                        id=f"MOV-TR-OUT-{uuid.uuid4().hex[:10]}",
                        etablissement=transfert.etablissementOrigine,
                        medicament=transfert.medicament,
                        lot=lot,
                        typeMouvement='SORTIE',
                        quantite=transfert.quantite,
                        reference=ref_transfert,
                        motif=f"Expédition finalisée (Réception TR {transfert.id})",
                        statut='valide'
                    )
                    traces.append("Mouvement de SORTIE (Origine) créé.")

                # B. CRÉATION DE L'ENTRÉE (Pour la Destination) - Si elle n'existe pas déjà
                if not Mouvement.objects.filter(reference=ref_transfert, typeMouvement='ENTREE').exists():
                    Mouvement.objects.create(
                        id=f"MOV-TR-IN-{uuid.uuid4().hex[:10]}",
                        etablissement=transfert.etablissementDestination,
                        medicament=transfert.medicament,
                        lot=lot,
                        typeMouvement='ENTREE',
                        quantite=transfert.quantite,
                        reference=ref_transfert,
                        motif=f"Réception du transfert {transfert.id}",
                        statut='valide'
                    )
                    traces.append("Mouvement d'ENTRÉE (Destination) créé.")

            except Exception as e:
                return Response({"error": f"Échec de la mise à jour des stocks: {str(e)}"}, status=500)
        
        response_data = serializer.data
        response_data['trace'] = traces
        return Response(response_data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_transfert_supprimer(request, pk):
    """Supprime un Transfert"""
    instance = get_object_or_404(Transfert, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Notification ---

@api_view(['GET'])
def api_notification_liste(request):
    """Liste les Notifications"""
    queryset = Notification.objects.all()
    serializer = NotificationSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_notification_ajout(request):
    """Ajoute un Notification"""
    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_notification_lecture(request, pk):
    """Détail d'un Notification"""
    instance = get_object_or_404(Notification, pk=pk)
    return Response(NotificationSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_notification_modifier(request, pk):
    """Modifie un Notification"""
    instance = get_object_or_404(Notification, pk=pk)
    serializer = NotificationSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_notification_supprimer(request, pk):
    """Supprime un Notification"""
    instance = get_object_or_404(Notification, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# --- Retour ---

@api_view(['GET'])
def api_retour_liste(request):
    """Liste les Retours"""
    queryset = Retour.objects.all()
    serializer = RetourSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_retour_ajout(request):
    """Ajoute un Retour"""
    serializer = RetourSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_retour_lecture(request, pk):
    """Détail d'un Retour"""
    instance = get_object_or_404(Retour, pk=pk)
    return Response(RetourSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_retour_modifier(request, pk):
    """Modifie un Retour"""
    instance = get_object_or_404(Retour, pk=pk)
    serializer = RetourSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_retour_supprimer(request, pk):
    """Supprime un Retour"""
    instance = get_object_or_404(Retour, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Fonctions Personnalisées ---

@api_view(['POST'])
def api_lot_rappel(request, pk):
    """Passe un lot au statut 'rappel'."""
    try:
        lot = Lot.objects.get(pk=pk)
    except Lot.DoesNotExist:
        return Response({"error": "Lot non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    lot.statut = 'rappel'
    lot.save()
    return Response({'status': 'lot rappelé'})

@api_view(['POST'])
def api_commande_avancer(request, pk):
    """Fait avancer une commande à l'étape suivante du workflow."""
    try:
        commande = Commande.objects.get(pk=pk)
    except Commande.DoesNotExist:
        return Response({"error": "Commande non trouvée"}, status=status.HTTP_404_NOT_FOUND)

    etapes = ['Brouillon', 'Soumis', 'Transmis', 'Préparation', 'Livraison', 'Reçue']
    try:
        current_idx = etapes.index(commande.statut)
        if current_idx < len(etapes) - 1:
            commande.statut = etapes[current_idx + 1]
            commande.progression = int(((current_idx + 1) / (len(etapes) - 1)) * 100)
            commande.save()
            
            # --- Mise à jour automatique du stock ---
            import uuid
            
            # 1. SORTIE de stock chez le FOURNISSEUR lors de l'expédition (Livraison)
            if commande.statut == 'Livraison' and commande.fournisseur_etab:
                lignes = commande.lignes.all()
                for ligne in lignes:
                    # Trouver un lot actif pour ce médicament chez le fournisseur
                    lot = Lot.objects.filter(medicament=ligne.medicament, statut='actif').first()
                    if lot:
                        Mouvement.objects.create(
                            id=f"MOV-OUT-{uuid.uuid4().hex[:12]}",
                            etablissement=commande.fournisseur_etab,
                            medicament=ligne.medicament,
                            lot=lot,
                            typeMouvement='SORTIE',
                            quantite=ligne.quantite,
                            reference=f"EXP-{commande.id}",
                            motif="Expédition Commande",
                            statut='valide'
                        )

            # 2. ENTRÉE de stock chez le DESTINATAIRE lors de la réception (Reçue)
            if commande.statut == 'Reçue':
                lignes = commande.lignes.all()
                for ligne in lignes:
                    lot = Lot.objects.filter(medicament=ligne.medicament, statut='actif').first()
                    if not lot:
                        f_id = "PSP-CI"
                        if not Fournisseur.objects.filter(id=f_id).exists():
                            first_f = Fournisseur.objects.first()
                            f_id = first_f.id if first_f else "FOURN-AUTO"
                            if not first_f:
                                Fournisseur.objects.create(id=f_id, nom="Fournisseur Automatique")
                        
                        lot = Lot.objects.create(
                            id=f"LOT-{uuid.uuid4().hex[:8]}",
                            medicament=ligne.medicament,
                            numeroLot=f"REC-{commande.id[:10]}",
                            fournisseur_id=f_id,
                            dateFabrication=datetime.date.today(),
                            datePeremption=datetime.date.today() + datetime.timedelta(days=365*2),
                            statut='actif'
                        )
                    
                    Mouvement.objects.create(
                        id=f"MOV-IN-{uuid.uuid4().hex[:12]}",
                        etablissement=commande.etablissement,
                        medicament=ligne.medicament,
                        lot=lot,
                        typeMouvement='ENTREE',
                        quantite=ligne.quantite,
                        reference=f"REC-{commande.id}",
                        motif="Réception Commande",
                        statut='valide'
                    )
            # -----------------------------------------------

            return Response({'status': 'commande avancée', 'nouveau_statut': commande.statut})
        return Response({'message': 'Commande déjà à l\'étape finale'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Statut de commande inconnu'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def api_demande_repondre(request, pk):
    """
    Répond à une demande de transfert :
    - Crée un Transfert
    - Met à jour quantiteSatisfaite sur la DemandeTransfert
    - Ferme la demande si entièrement satisfaite
    """
    try:
        demande = DemandeTransfert.objects.get(pk=pk)
    except DemandeTransfert.DoesNotExist:
        return Response({"error": "Demande non trouvée"}, status=status.HTTP_404_NOT_FOUND)

    etablissement_repondant_id = request.data.get('etablissementRepondantId')
    quantite = request.data.get('quantite')

    if not etablissement_repondant_id or not quantite:
        return Response({"error": "etablissementRepondantId et quantite sont requis"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        etab_repondant = Etablissement.objects.get(pk=etablissement_repondant_id)
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement répondant non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    try:
        etab_demandeur = Etablissement.objects.get(pk=demande.etablissementDemandeur_id)
    except Etablissement.DoesNotExist:
        return Response({"error": "Établissement demandeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    import uuid
    # Créer le transfert
    transfert = Transfert.objects.create(
        id=str(uuid.uuid4())[:50],
        etablissementOrigine=etab_repondant,
        etablissementDestination=etab_demandeur,
        medicament=demande.medicament,
        quantite=quantite,
        statut='En attente',
        urgence=demande.urgence,
        demandeTransfert=demande
    )

    # Mettre à jour la demande
    demande.quantiteSatisfaite = float(demande.quantiteSatisfaite) + float(quantite)
    if demande.quantiteSatisfaite >= demande.quantiteDemandee:
        demande.statut = 'Clôturée'
    else:
        demande.statut = 'Partiellement satisfaite'
    demande.save()

    return Response({
        'status': 'demande satisfaite',
        'transfertId': transfert.id,
        'nouveauStatutDemande': demande.statut,
        'quantiteSatisfaite': float(demande.quantiteSatisfaite)
    })

@api_view(['GET'])
def api_dashboard_stats(request):
    """Calcule des statistiques consolidées pour le tableau de bord."""
    etab_id = request.query_params.get('etablissement_id')
    if not etab_id:
        return Response({"error": "etablissement_id est requis"}, status=400)
    
    etablissements_ids = [etab_id]
    # Si besoin de récursivité pour voir les sous-structures (ex: National voit tout)
    # Pour l'instant on se limite à l'établissement demandé pour la précision
    
    queryset_mouvements = Mouvement.objects.filter(etablissement_id=etab_id, statut='valide')
    
    # 1. Calcul du stock par médicament pour cet établissement
    # Note: On regroupe par médicament
    stats_medicaments = Medicament.objects.filter(actif=True).annotate(
        entrees=Sum('mouvement__quantite', filter=Q(mouvement__etablissement_id=etab_id, mouvement__typeMouvement='ENTREE', mouvement__statut='valide')),
        sorties=Sum('mouvement__quantite', filter=Q(mouvement__etablissement_id=etab_id, mouvement__typeMouvement__in=['SORTIE', 'DESTRUCTION'], mouvement__statut='valide'))
    )
    
    ruptures = 0
    stock_bas = 0
    total_meds = stats_medicaments.count()
    disponibles = 0
    
    alertes = []
    
    for med in stats_medicaments:
        stock = (med.entrees or 0) - (med.sorties or 0)
        if stock <= 0:
            ruptures += 1
        else:
            disponibles += 1
            if stock <= med.seuilMin:
                stock_bas += 1
        
        # Préparation des alertes (top 5 bas/rupture)
        if stock <= med.seuilMin:
            alertes.append({
                "id": med.id,
                "nom": med.dci,
                "dosage": med.dosage,
                "stock": float(stock),
                "cmm": float(med.seuilMin),
                "statut": "Rupture" if stock <= 0 else "Stock Bas"
            })

    alertes = sorted(alertes, key=lambda x: x['stock'])[:5]
    
    # 2. Transferts Stats
    transferts_all = Transfert.objects.filter(
        Q(etablissementOrigine_id=etab_id) | Q(etablissementDestination_id=etab_id)
    )
    en_attente = transferts_all.filter(statut='En attente').count()
    valides = transferts_all.filter(statut__in=['Validé', 'Livre', 'Livré', 'Validite']).count()
    rejetes = transferts_all.filter(statut='Rejeté').count()
    
    # 3. Mouvements récents
    mouvements_recents = Mouvement.objects.filter(etablissement_id=etab_id).order_by('-dateMouvement')[:5]
    list_mouvements = []
    for m in mouvements_recents:
        list_mouvements.append({
            "id": m.id,
            "type": m.typeMouvement,
            "nomMedicament": m.medicament.dci,
            "quantite": float(m.quantite),
            "date": m.dateMouvement.strftime("%d/%m/%Y"),
            "auteur": m.auteur.username if m.auteur else "Système",
            "direction": m.typeMouvement.lower()
        })

    taux_dispo = round((disponibles / total_meds * 100), 1) if total_meds > 0 else 0

    return Response({
        "tauxDisponibilite": taux_dispo,
        "nombreRuptures": ruptures,
        "nombreStockBas": stock_bas,
        "nombreTransfertsEnAttente": en_attente,
        "transfertsStats": {
            "enAttente": en_attente,
            "valides": valides,
            "rejetes": rejetes
        },
        "alertesStock": alertes,
        "mouvementsRecents": list_mouvements,
        "tendanceDispo": 1.2 # Simulation de tendance
    })

@api_view(['POST'])
def api_notifications_marquer_lues(request):
    """Marque toutes les notifications non lues de l'utilisateur connecté comme lues."""
    Notification.objects.filter(destinataireUtilisateur=request.user, lue=False).update(lue=True)
    return Response({'status': 'notifications marquées lues'})

# --- Saison ---

@api_view(['GET'])
def api_saison_liste(request):
    """Liste les Saisons"""
    queryset = Saison.objects.all()
    serializer = SaisonSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def api_saison_ajout(request):
    """Ajoute un Saison"""
    serializer = SaisonSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def api_saison_lecture(request, pk):
    """Détail d'un Saison"""
    instance = get_object_or_404(Saison, pk=pk)
    return Response(SaisonSerializer(instance).data)

@api_view(['PUT', 'PATCH'])
def api_saison_modifier(request, pk):
    """Modifie un Saison"""
    instance = get_object_or_404(Saison, pk=pk)
    serializer = SaisonSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def api_saison_supprimer(request, pk):
    """Supprime un Saison"""
    instance = get_object_or_404(Saison, pk=pk)
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
