import { UserRole } from "@mall/types";

export type OnboardedFilterValue = 'ALL' | 'COMPLETED' | 'PENDING';
export type RoleFilterValue = 'ALL' | UserRole;

export interface UserSearchFilterState {
  keyword: string;
  role: RoleFilterValue;
  onboarded: OnboardedFilterValue;
}