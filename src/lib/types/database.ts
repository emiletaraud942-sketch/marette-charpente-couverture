export type RoleEmploye = "admin" | "chef_chantier" | "ouvrier";
export type StatutEmploye = "actif" | "conge" | "arret" | "inactif";
export type StatutChantier = "a_venir" | "en_cours" | "termine";
export type TypeHabilitation =
  | "caces"
  | "habilitation_electrique"
  | "travail_hauteur"
  | "visite_medicale"
  | "autre";
export type TypeAbsence = "conge" | "maladie" | "autre";
export type StatutAbsence = "demande" | "valide" | "refuse";

export type Employe = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: RoleEmploye;
  statut: StatutEmploye;
  date_entree: string | null;
  created_at: string;
};

export type Chantier = {
  id: string;
  nom: string;
  client: string | null;
  adresse: string | null;
  date_debut: string | null;
  date_fin: string | null;
  statut: StatutChantier;
  created_at: string;
};

export type Affectation = {
  id: string;
  employe_id: string;
  chantier_id: string;
  date_debut: string;
  date_fin: string | null;
  role_sur_chantier: string | null;
  created_at: string;
};

export type Pointage = {
  id: string;
  employe_id: string;
  chantier_id: string | null;
  heure_entree: string;
  heure_sortie: string | null;
  created_at: string;
};

export type Habilitation = {
  id: string;
  employe_id: string;
  type: TypeHabilitation;
  libelle: string | null;
  date_obtention: string | null;
  date_expiration: string | null;
  created_at: string;
};

export type Absence = {
  id: string;
  employe_id: string;
  type: TypeAbsence;
  date_debut: string;
  date_fin: string;
  statut: StatutAbsence;
  created_at: string;
};

/** Ligne du tableau de bord du jour : un employé + son affectation du jour. */
export type LigneDashboard = {
  employe: Employe;
  affectation: (Affectation & { chantier: Chantier }) | null;
  pointage_en_cours: Pointage | null;
};

export type CategorieMateriau = "bois" | "quincaillerie" | "isolation" | "couverture" | "autre";
export type TypeMouvementStock = "entree" | "sortie";

export type Materiau = {
  id: string;
  nom: string;
  categorie: CategorieMateriau;
  unite: string;
  seuil_alerte: number | null;
  created_at: string;
};

export type StockMouvement = {
  id: string;
  materiau_id: string;
  type: TypeMouvementStock;
  quantite: number;
  chantier_id: string | null;
  motif: string | null;
  employe_id: string | null;
  created_at: string;
};

/** Niveau de stock courant d'un matériau (vue stock_niveaux). */
export type StockNiveau = {
  materiau_id: string;
  nom: string;
  categorie: CategorieMateriau;
  unite: string;
  seuil_alerte: number | null;
  quantite_actuelle: number;
};
