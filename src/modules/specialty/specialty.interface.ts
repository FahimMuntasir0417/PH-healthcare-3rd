export type TSpecialty = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

export type TSpecialtyCreatePayload = {
  title: string;
  description?: string | null;
  icon?: string | null;
};

export type TSpecialtyUpdatePayload = {
  title?: string;
  description?: string | null;
  icon?: string | null;
};
