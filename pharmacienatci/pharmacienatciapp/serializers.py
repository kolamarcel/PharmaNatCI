from rest_framework import serializers

from .models import (
    Region, Role, Categorie, Fournisseur, Etablissement, 
    Utilisateur, Medicament, Lot, Mouvement, Commande, 
    LigneCommande, DemandeTransfert, Transfert, Notification,
    Retour, Saison
)

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = '__all__'

class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'

class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = '__all__'

class EtablissementSerializer(serializers.ModelSerializer):
    regionId = serializers.PrimaryKeyRelatedField(source='region', queryset=Region.objects.all(), required=False, allow_null=True)
    parentId = serializers.PrimaryKeyRelatedField(source='parent', queryset=Etablissement.objects.all(), required=False, allow_null=True)
    photo = serializers.ImageField(required=False, allow_null=True, use_url=True)
    
    class Meta:
        model = Etablissement
        fields = ('id', 'nom', 'type', 'regionId', 'parentId', 'adresse', 'longitude', 'latitude', 'telephone', 'email', 'photo', 'actif')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('photo') and not ret['photo'].startswith('http'):
            request = self.context.get('request')
            if request:
                ret['photo'] = request.build_absolute_uri(ret['photo'])
            else:
                ret['photo'] = f"http://localhost:8000{ret['photo']}"
        return ret

class UtilisateurSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(
        source='role_entity', 
        queryset=Role.objects.all(),
        required=False,
        allow_null=True
    )
    etablissementId = serializers.PrimaryKeyRelatedField(
        source='etablissement', 
        queryset=Etablissement.objects.all(), 
        required=False, 
        allow_null=True
    )
    # 'nom' est un champ calculé attendu par le frontend
    nom = serializers.SerializerMethodField()
    actif = serializers.BooleanField(source='is_active', required=False)
    password = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def get_nom(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    photo = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = Utilisateur
        fields = ('id', 'username', 'email', 'matricule', 'first_name', 'last_name',
                  'nom', 'telephone', 'fonction', 'photo', 'role', 'etablissementId', 'actif', 'password',
                  'notif_rupture', 'notif_commande', 'notif_systeme')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('photo') and not ret['photo'].startswith('http'):
            request = self.context.get('request')
            if request:
                ret['photo'] = request.build_absolute_uri(ret['photo'])
            else:
                ret['photo'] = f"http://localhost:8000{ret['photo']}"
        return ret

class MedicamentSerializer(serializers.ModelSerializer):
    categorieId = serializers.PrimaryKeyRelatedField(source='categorie', queryset=Categorie.objects.all(), required=False, allow_null=True)
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    
    class Meta:
        model = Medicament
        fields = ('id', 'dci', 'nomCommercial', 'forme', 'dosage', 'codeATC', 'unite', 'seuilMin', 'seuilAlerte', 'laboratoire', 'description', 'prixUnitaire', 'image', 'categorieId', 'actif')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('image') and not ret['image'].startswith('http'):
            request = self.context.get('request')
            if request:
                ret['image'] = request.build_absolute_uri(ret['image'])
            else:
                ret['image'] = f"http://localhost:8000{ret['image']}"
        return ret

class LotSerializer(serializers.ModelSerializer):
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    fournisseurId = serializers.PrimaryKeyRelatedField(source='fournisseur', queryset=Fournisseur.objects.all())
    
    class Meta:
        model = Lot
        fields = ('id', 'medicamentId', 'numeroLot', 'fournisseurId', 'dateFabrication', 'datePeremption', 'statut')

class MouvementSerializer(serializers.ModelSerializer):
    etablissementId = serializers.PrimaryKeyRelatedField(source='etablissement', queryset=Etablissement.objects.all())
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    lotId = serializers.PrimaryKeyRelatedField(source='lot', queryset=Lot.objects.all())
    auteurId = serializers.PrimaryKeyRelatedField(source='auteur', queryset=Utilisateur.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Mouvement
        fields = ('id', 'etablissementId', 'medicamentId', 'lotId', 'typeMouvement', 'quantite', 'dateMouvement', 'reference', 'auteurId', 'motif', 'statut')

class LigneCommandeSerializer(serializers.ModelSerializer):
    commandeId = serializers.PrimaryKeyRelatedField(source='commande', queryset=Commande.objects.all())
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    
    class Meta:
        model = LigneCommande
        fields = ('id', 'commandeId', 'medicamentId', 'quantite')

class CommandeSerializer(serializers.ModelSerializer):
    etablissementId = serializers.PrimaryKeyRelatedField(source='etablissement', queryset=Etablissement.objects.all())
    fournisseurId = serializers.PrimaryKeyRelatedField(source='fournisseur_etab', queryset=Etablissement.objects.all(), required=False, allow_null=True)
    auteurId = serializers.PrimaryKeyRelatedField(source='auteur', queryset=Utilisateur.objects.all(), required=False, allow_null=True)
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Commande
        fields = ('id', 'etablissementId', 'fournisseurId', 'auteurId', 'dateCreation', 'statut', 'urgente', 'progression', 'lignes')

class DemandeTransfertSerializer(serializers.ModelSerializer):
    etablissementDemandeurId = serializers.PrimaryKeyRelatedField(source='etablissementDemandeur', queryset=Etablissement.objects.all())
    etablissementCibleId = serializers.PrimaryKeyRelatedField(source='etablissementCible', queryset=Etablissement.objects.all(), required=False, allow_null=True)
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    
    class Meta:
        model = DemandeTransfert
        fields = ('id', 'etablissementDemandeurId', 'etablissementCibleId', 'medicamentId', 'quantiteDemandee', 'quantiteSatisfaite', 'statut', 'dateDemande', 'urgence')

class TransfertSerializer(serializers.ModelSerializer):
    etablissementOrigineId = serializers.PrimaryKeyRelatedField(source='etablissementOrigine', queryset=Etablissement.objects.all())
    etablissementDestinationId = serializers.PrimaryKeyRelatedField(source='etablissementDestination', queryset=Etablissement.objects.all())
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    demandeTransfertId = serializers.PrimaryKeyRelatedField(source='demandeTransfert', queryset=DemandeTransfert.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Transfert
        fields = ('id', 'etablissementOrigineId', 'etablissementDestinationId', 'medicamentId', 'quantite', 'statut', 'urgence', 'dateTransfert', 'demandeTransfertId')

class NotificationSerializer(serializers.ModelSerializer):
    destinataireId = serializers.PrimaryKeyRelatedField(source='destinataireUtilisateur', queryset=Utilisateur.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ('id', 'titre', 'message', 'date', 'lue', 'destinataireRole', 'destinataireId')

class RetourSerializer(serializers.ModelSerializer):
    etablissementId = serializers.PrimaryKeyRelatedField(source='etablissement', queryset=Etablissement.objects.all())
    medicamentId = serializers.PrimaryKeyRelatedField(source='medicament', queryset=Medicament.objects.all())
    lotId = serializers.PrimaryKeyRelatedField(source='lot', queryset=Lot.objects.all())

    class Meta:
        model = Retour
        fields = ('id', 'etablissementId', 'medicamentId', 'lotId', 'quantite', 'motif', 'statut', 'dateRetour')

class SaisonSerializer(serializers.ModelSerializer):
    regionId = serializers.PrimaryKeyRelatedField(source='region', queryset=Region.objects.all())

    class Meta:
        model = Saison
        fields = ('id', 'nom', 'mois', 'regionId', 'actif')
