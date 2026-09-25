export type CommissionDiscountType = "fixed" | "percentage";

export type Partner = {
  id: string;
  user_id: string;
  name: string;
  mobile: string;
  email: string | null;
  organization_name: string | null;
  institution: string | null;
  facebook_link: string | null;
  linkedin_link: string | null;
  profile_picture_path: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  creator_name: string | null;
  updated_by: string | null;
  updater_name: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerConfig = {
  id: string;
  partner_id: string;
  code: string;
  commission: number;
  commission_type: CommissionDiscountType;
  discount: number;
  discount_type: CommissionDiscountType;
  total_orders: number;
  total_delivered_orders: number;
  total_commission: number;
  total_discount: number;
  updated_by: string | null;
  updater_name: string | null;
  created_at: string;
  updated_at: string;
};

/** A partner row joined with its config — the shape the admin list/detail screens read. */
export type PartnerWithConfig = Partner & { config: PartnerConfig };

export type PartnerProfileInput = {
  name: string;
  mobile: string;
  email?: string | null;
  organization_name?: string | null;
  institution?: string | null;
  facebook_link?: string | null;
  linkedin_link?: string | null;
  profile_picture_path?: string | null;
  is_active?: boolean;
  is_default?: boolean;
};

export type PartnerCommissionDiscountInput = {
  commission: number;
  commission_type: CommissionDiscountType;
  discount: number;
  discount_type: CommissionDiscountType;
};
