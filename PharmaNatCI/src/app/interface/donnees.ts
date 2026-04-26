export interface Role {
  code: string;
  nom: string;
  description?: string;
}

export interface Utilisateur {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nom?: string; // read-only full name
  email: string;
  role: string;
  etablissementId: string | null;
  actif?: boolean;
  telephone?: string;
  matricule?: string;
  password?: string;
  fonction?: string;
  photo?: string;
  notif_rupture?: boolean;
  notif_commande?: boolean;
  notif_systeme?: boolean;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  destinataireRole?: string;
  destinataireId?: string;
}

export interface Region {
  id: string;
  nom: string;
  code?: string;
}

export interface Etablissement {
  id: string;
  nom: string;
  type: 'PHARMACIE' | 'REGION' | 'NATIONAL';
  regionId: string; // Geographical region ID
  parentId?: string; // Supply chain parent (e.g., Pharmacy -> Region, Region -> National)
  actif?: boolean;
  adresse?: string;
  longitude?: number;
  latitude?: number;
  telephone?: string;
  email?: string;
  photo?: string;
}

export interface Categorie {
  id: string;
  nom: string;
  actif?: boolean;
}

export interface Fournisseur {
  id: string;
  nom: string;
}

export interface Medicament {
  id: string;
  dci: string;
  nomCommercial: string;
  forme: string;
  dosage: string;
  codeATC: string;
  unite: string;
  seuilMin: number;
  seuilAlerte: number;
  categorieId: string;
  image?: string;
  actif?: boolean;
  laboratoire?: string;
  description?: string;
  prixUnitaire?: number;
}

export interface Lot {
  id: string;
  medicamentId: string;
  numeroLot: string;
  fournisseurId: string;
  dateFabrication: string;
  datePeremption: string;
  statut: 'actif' | 'expire' | 'rappel';
}

export interface Mouvement {
  id: string;
  etablissementId: string;
  medicamentId: string;
  lotId: string;
  typeMouvement: 'ENTREE' | 'SORTIE' | 'DESTRUCTION' | 'AJUSTEMENT';
  quantite: number;
  dateMouvement: string;
  reference: string;
  auteurId?: string;
  statut?: 'en_attente' | 'valide' | 'rejete';
  motif?: string;
}

export interface Commande {
  id: string;
  etablissementId: string; // The one who orders
  auteurId?: string; // The specific user who created the order
  fournisseurId?: string; // The one who supplies (Region, National, or External)
  dateCreation: string;
  statut: 'Brouillon' | 'Soumis' | 'Transmis' | 'Préparation' | 'Livraison' | 'Reçue' | 'Annulé';
  urgente: boolean;
  progression?: number;
}

export interface CommandeView {
  id: string;
  reference: string;
  date: string;
  articles: number;
  statut: Commande['statut'];
  progression: number;
  etablissement: string;
  etablissementId: string;
  fournisseur: string;
  fournisseurId?: string;
  urgente: boolean;
  auteurId?: string;
}

export interface LigneCommande {
  id: string;
  commandeId: string;
  medicamentId: string;
  quantite: number;
}

export interface Transfert {
  id: string;
  etablissementOrigineId: string;
  etablissementDestinationId: string;
  medicamentId: string;
  quantite: number;
  statut: string;
  urgence: string;
  dateTransfert: string;
  demandeTransfertId?: string; // Link to the request if applicable
}

export interface DemandeTransfert {
  id: string;
  etablissementDemandeurId: string;
  etablissementCibleId: string; // 'TOUS' or specific ID
  medicamentId: string;
  quantiteDemandee: number;
  quantiteSatisfaite: number;
  statut: 'Ouverte' | 'Partiellement satisfaite' | 'Clôturée' | 'Annulée';
  urgence: string;
  dateDemande: string;
}

export interface DemandeTransfertView extends DemandeTransfert {
  demandeurNom: string;
  cibleNom: string;
  medicamentNom: string;
}

export interface Retour {
  id: string;
  etablissementId: string;
  medicamentId: string;
  lotId: string;
  quantite: number;
  motif: 'Avarie' | 'Non-conformité' | 'Péremption' | 'Rappel';
  statut: 'En attente' | 'Approuvé' | 'Rejeté';
  dateRetour: string;
}

export interface Prevision {
  id: string;
  medicamentId: string;
  medicamentNom?: string;
  etablissementId?: string;
  etablissementNom?: string;
  regionId?: string;
  regionNom?: string;
  niveau?: 'etablissement' | 'region';
  mois: string;
  dateFocalisation?: string;
  demandePrevue: number;
  confiance: number;
  facteurs: string[];
  stockActuelCalcule?: number;
  risqueRupture?: boolean;
  dateRuptureEstimee?: string;
  recommandationCommande?: boolean;
  quantiteCommandeRecommandee?: number;
  recommandationTransfert?: boolean;
  etablissementSourceTransfertId?: string;
}

export interface Saison {
  id: string;
  nom: string;
  mois: number[];  // tableau de numéros de mois (1-12)
  regionId: string;
  actif: boolean;
}

export interface StockEtablissementView {
  id: string;
  medicamentId: string;
  nom: string;
  etablissementId: string;
  etablissementNom: string;
  forme: string;
  dosage: string;
  categorie: string;
  image?: string;
  stock: number;
  cmm: number;
  seuilAlerte: number;
}


