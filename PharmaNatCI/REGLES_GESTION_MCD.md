# Règles de Gestion et Modèle Conceptuel de Données (MCD) - PharmaNat-CI

Ce document présente l'analyse approfondie du système de gestion des pharmacies publiques (PharmaNat-CI) selon la méthode MERISE. Les règles de gestion sont listées de manière séquentielle et logique, sans catégorisation, afin de garantir qu'aucun concept n'est utilisé avant d'avoir été défini.

## 1. Règles de Gestion

1. Le système gère des **régions** sanitaires. Une région est identifiée par un code unique et possède un nom.
2. Le système gère des **établissements**. Un établissement possède un nom, un type (National, Région, Pharmacie) et un statut d'activité.
3. Un établissement peut appartenir à une et une seule région. Une région peut contenir plusieurs établissements.
4. Un établissement peut être rattaché à un établissement parent (hiérarchie). Un établissement peut avoir plusieurs établissements enfants.
5. Le système gère des **catégories** de médicaments. Une catégorie possède un nom et un statut d'activité.
6. Le système gère des **médicaments**. Un médicament est défini par sa DCI, son nom commercial, sa forme, son dosage, son code ATC, son unité, un seuil minimum, un seuil d'alerte, un laboratoire, un prix unitaire, une description, une image et un statut d'activité.
7. Un médicament appartient à une et une seule catégorie. Une catégorie peut regrouper plusieurs médicaments.
8. Le système gère des **fournisseurs**. Un fournisseur possède un nom.
9. Le système gère des **lots** de médicaments. Un lot est identifié par un numéro, une date de fabrication, une date de péremption, une quantité initiale et une quantité restante.
10. Un lot concerne un et un seul médicament. Un médicament peut être stocké sous plusieurs lots.
11. Un lot est localisé dans un et un seul établissement. Un établissement peut stocker plusieurs lots.
12. Un lot peut être fourni par un fournisseur. Un fournisseur peut fournir plusieurs lots.
13. Le système gère des **utilisateurs**. Un utilisateur possède un nom, un email, un rôle (superviseur national, pharmacien région, pharmacien pharmacie, agent caisse, admin central), un matricule, un mot de passe, un téléphone, une fonction, une photo et un statut d'activité.
14. Un utilisateur peut être rattaché à un établissement. Un établissement peut avoir plusieurs utilisateurs.
15. Le système gère des **mouvements** de stock. Un mouvement est caractérisé par un type (Entrée, Sortie, Ajustement), une quantité, une date, un motif et une référence de document.
16. Un mouvement concerne un et un seul lot. Un lot peut subir plusieurs mouvements.
17. Un mouvement est effectué dans un établissement. Un établissement enregistre plusieurs mouvements.
18. Un mouvement est tracé par un utilisateur. Un utilisateur peut tracer plusieurs mouvements.
19. Le système gère des **commandes**. Une commande possède une date de commande, un statut (Brouillon, En attente, Validée, Rejetée, Livrée partiellement, Terminée) et une date de livraison prévue.
20. Une commande est émise par un établissement. Un établissement peut émettre plusieurs commandes.
21. Une commande est adressée à un établissement source (fournisseur interne). Un établissement source peut recevoir plusieurs commandes.
22. Une commande est créée par un utilisateur. Un utilisateur peut créer plusieurs commandes.
23. Une commande est composée de **lignes de commande**. Une ligne de commande précise une quantité demandée, une quantité livrée et un prix unitaire.
24. Une ligne de commande appartient à une et une seule commande. Une commande contient au moins une ligne de commande.
25. Une ligne de commande concerne un et un seul médicament. Un médicament peut figurer sur plusieurs lignes de commande.
26. Le système gère des **transferts** de stock. Un transfert possède une date, un statut (En préparation, En transit, Reçu, Annulé) et une référence.
27. Un transfert a pour origine un établissement source. Un établissement peut être à l'origine de plusieurs transferts.
28. Un transfert a pour destination un établissement. Un établissement peut être la destination de plusieurs transferts.
29. Un transfert est initié par un utilisateur. Un utilisateur peut initier plusieurs transferts.
30. Un transfert est composé de **lignes de transfert**. Une ligne de transfert précise une quantité.
31. Une ligne de transfert appartient à un et un seul transfert. Un transfert contient au moins une ligne de transfert.
32. Une ligne de transfert concerne un lot spécifique. Un lot peut faire l'objet de plusieurs lignes de transfert.
33. Le système gère des **demandes de transfert**. Une demande possède une date, un statut (Nouvelle, Validée, Refusée, Traitée) et un niveau d'urgence (Basse, Normale, Haute).
34. Une demande de transfert est émise par un établissement demandeur. Un établissement peut émettre plusieurs demandes.
35. Une demande de transfert est adressée à un établissement fournisseur. Un établissement peut recevoir plusieurs demandes.
36. Une demande de transfert est créée par un utilisateur. Un utilisateur peut créer plusieurs demandes.
37. Une demande de transfert est composée de **lignes de demande**. Une ligne de demande précise une quantité.
38. Une ligne de demande appartient à une et une seule demande de transfert. Une demande contient au moins une ligne de demande.
39. Une ligne de demande concerne un et un seul médicament. Un médicament peut figurer sur plusieurs lignes de demande.
40. Le système gère des **retours** de médicaments. Un retour possède une date, un motif (Périmé, Avarié, Rappel, Surstock) et un statut (En attente, Validé, Rejeté).
41. Un retour est effectué par un établissement. Un établissement peut effectuer plusieurs retours.
42. Un retour est enregistré par un utilisateur. Un utilisateur peut enregistrer plusieurs retours.
43. Un retour est composé de **lignes de retour**. Une ligne de retour précise une quantité.
44. Une ligne de retour appartient à un et un seul retour. Un retour contient au moins une ligne de retour.
45. Une ligne de retour concerne un lot spécifique. Un lot peut figurer sur plusieurs lignes de retour.
46. Le système gère des **prévisions** de consommation. Une prévision concerne une année, un mois, une quantité prévue, une méthode de calcul et un indice de fiabilité.
47. Une prévision est calculée pour un médicament. Un médicament peut faire l'objet de plusieurs prévisions.
48. Une prévision est calculée pour un établissement. Un établissement peut avoir plusieurs prévisions.
49. Le système gère des **notifications**. Une notification possède un titre, un message, une date, un statut de lecture et un type (Alerte stock, Commande, Transfert, Système).
50. Une notification est destinée à un et un seul utilisateur. Un utilisateur peut recevoir plusieurs notifications.

---

## 2. Modèle Conceptuel de Données (MCD)

Le MCD est représenté ici sous forme textuelle (Entités et Associations) respectant le formalisme MERISE.

### Entités

*   **REGION** (id_region, code, nom)
*   **ETABLISSEMENT** (id_etablissement, nom, type, actif)
*   **CATEGORIE** (id_categorie, nom, actif)
*   **MEDICAMENT** (id_medicament, dci, nomCommercial, forme, dosage, codeATC, unite, seuilMin, seuilAlerte, laboratoire, prixUnitaire, description, image, actif)
*   **FOURNISSEUR** (id_fournisseur, nom)
*   **LOT** (id_lot, numero, dateFabrication, datePeremption, quantiteInitiale, quantiteRestante)
*   **UTILISATEUR** (id_utilisateur, nom, email, role, matricule, motDePasse, telephone, fonction, photo, actif)
*   **MOUVEMENT** (id_mouvement, type, quantite, date, motif, referenceDocument)
*   **COMMANDE** (id_commande, dateCommande, statut, dateLivraisonPrevue)
*   **LIGNE_COMMANDE** (id_ligne_commande, quantiteDemandee, quantiteLivree, prixUnitaire)
*   **TRANSFERT** (id_transfert, dateTransfert, statut, reference)
*   **LIGNE_TRANSFERT** (id_ligne_transfert, quantite)
*   **DEMANDE_TRANSFERT** (id_demande, dateDemande, statut, urgence)
*   **LIGNE_DEMANDE** (id_ligne_demande, quantite)
*   **RETOUR** (id_retour, dateRetour, motif, statut)
*   **LIGNE_RETOUR** (id_ligne_retour, quantite)
*   **PREVISION** (id_prevision, annee, mois, quantitePrevue, methode, fiabilite)
*   **NOTIFICATION** (id_notification, titre, message, date, lue, type)

### Associations (Relations)

*   **SITUER** (REGION, ETABLISSEMENT)
    *   REGION (0,n) - SITUER - (1,1) ETABLISSEMENT
*   **HIERARCHISER** (ETABLISSEMENT_PARENT, ETABLISSEMENT_ENFANT)
    *   ETABLISSEMENT (0,n) - HIERARCHISER - (0,1) ETABLISSEMENT
*   **APPARTENIR** (MEDICAMENT, CATEGORIE)
    *   MEDICAMENT (1,1) - APPARTENIR - (0,n) CATEGORIE
*   **CONCERNER_LOT** (LOT, MEDICAMENT)
    *   LOT (1,1) - CONCERNER_LOT - (0,n) MEDICAMENT
*   **LOCALISER** (LOT, ETABLISSEMENT)
    *   LOT (1,1) - LOCALISER - (0,n) ETABLISSEMENT
*   **FOURNIR** (LOT, FOURNISSEUR)
    *   LOT (0,1) - FOURNIR - (0,n) FOURNISSEUR
*   **AFFECTER** (UTILISATEUR, ETABLISSEMENT)
    *   UTILISATEUR (0,1) - AFFECTER - (0,n) ETABLISSEMENT
*   **TRACER_MOUVEMENT** (MOUVEMENT, LOT)
    *   MOUVEMENT (1,1) - TRACER_MOUVEMENT - (0,n) LOT
*   **EFFECTUER_MOUVEMENT** (MOUVEMENT, ETABLISSEMENT)
    *   MOUVEMENT (1,1) - EFFECTUER_MOUVEMENT - (0,n) ETABLISSEMENT
*   **ENREGISTRER_MOUVEMENT** (MOUVEMENT, UTILISATEUR)
    *   MOUVEMENT (1,1) - ENREGISTRER_MOUVEMENT - (0,n) UTILISATEUR
*   **EMETTRE_COMMANDE** (COMMANDE, ETABLISSEMENT)
    *   COMMANDE (1,1) - EMETTRE_COMMANDE - (0,n) ETABLISSEMENT
*   **RECEVOIR_COMMANDE** (COMMANDE, ETABLISSEMENT)
    *   COMMANDE (1,1) - RECEVOIR_COMMANDE - (0,n) ETABLISSEMENT
*   **CREER_COMMANDE** (COMMANDE, UTILISATEUR)
    *   COMMANDE (1,1) - CREER_COMMANDE - (0,n) UTILISATEUR
*   **COMPOSER_COMMANDE** (COMMANDE, LIGNE_COMMANDE)
    *   COMMANDE (1,n) - COMPOSER_COMMANDE - (1,1) LIGNE_COMMANDE
*   **CONCERNER_LIGNE_COMMANDE** (LIGNE_COMMANDE, MEDICAMENT)
    *   LIGNE_COMMANDE (1,1) - CONCERNER_LIGNE_COMMANDE - (0,n) MEDICAMENT
*   **ORIGINE_TRANSFERT** (TRANSFERT, ETABLISSEMENT)
    *   TRANSFERT (1,1) - ORIGINE_TRANSFERT - (0,n) ETABLISSEMENT
*   **DESTINATION_TRANSFERT** (TRANSFERT, ETABLISSEMENT)
    *   TRANSFERT (1,1) - DESTINATION_TRANSFERT - (0,n) ETABLISSEMENT
*   **INITIER_TRANSFERT** (TRANSFERT, UTILISATEUR)
    *   TRANSFERT (1,1) - INITIER_TRANSFERT - (0,n) UTILISATEUR
*   **COMPOSER_TRANSFERT** (TRANSFERT, LIGNE_TRANSFERT)
    *   TRANSFERT (1,n) - COMPOSER_TRANSFERT - (1,1) LIGNE_TRANSFERT
*   **CONCERNER_LIGNE_TRANSFERT** (LIGNE_TRANSFERT, LOT)
    *   LIGNE_TRANSFERT (1,1) - CONCERNER_LIGNE_TRANSFERT - (0,n) LOT
*   **DEMANDER_TRANSFERT** (DEMANDE_TRANSFERT, ETABLISSEMENT)
    *   DEMANDE_TRANSFERT (1,1) - DEMANDER_TRANSFERT - (0,n) ETABLISSEMENT
*   **FOURNIR_TRANSFERT** (DEMANDE_TRANSFERT, ETABLISSEMENT)
    *   DEMANDE_TRANSFERT (1,1) - FOURNIR_TRANSFERT - (0,n) ETABLISSEMENT
*   **CREER_DEMANDE** (DEMANDE_TRANSFERT, UTILISATEUR)
    *   DEMANDE_TRANSFERT (1,1) - CREER_DEMANDE - (0,n) UTILISATEUR
*   **COMPOSER_DEMANDE** (DEMANDE_TRANSFERT, LIGNE_DEMANDE)
    *   DEMANDE_TRANSFERT (1,n) - COMPOSER_DEMANDE - (1,1) LIGNE_DEMANDE
*   **CONCERNER_LIGNE_DEMANDE** (LIGNE_DEMANDE, MEDICAMENT)
    *   LIGNE_DEMANDE (1,1) - CONCERNER_LIGNE_DEMANDE - (0,n) MEDICAMENT
*   **EFFECTUER_RETOUR** (RETOUR, ETABLISSEMENT)
    *   RETOUR (1,1) - EFFECTUER_RETOUR - (0,n) ETABLISSEMENT
*   **ENREGISTRER_RETOUR** (RETOUR, UTILISATEUR)
    *   RETOUR (1,1) - ENREGISTRER_RETOUR - (0,n) UTILISATEUR
*   **COMPOSER_RETOUR** (RETOUR, LIGNE_RETOUR)
    *   RETOUR (1,n) - COMPOSER_RETOUR - (1,1) LIGNE_RETOUR
*   **CONCERNER_LIGNE_RETOUR** (LIGNE_RETOUR, LOT)
    *   LIGNE_RETOUR (1,1) - CONCERNER_LIGNE_RETOUR - (0,n) LOT
*   **PREVOIR_MEDICAMENT** (PREVISION, MEDICAMENT)
    *   PREVISION (1,1) - PREVOIR_MEDICAMENT - (0,n) MEDICAMENT
*   **PREVOIR_ETABLISSEMENT** (PREVISION, ETABLISSEMENT)
    *   PREVISION (1,1) - PREVOIR_ETABLISSEMENT - (0,n) ETABLISSEMENT
*   **RECEVOIR_NOTIFICATION** (NOTIFICATION, UTILISATEUR)
    *   NOTIFICATION (1,1) - RECEVOIR_NOTIFICATION - (0,n) UTILISATEUR
