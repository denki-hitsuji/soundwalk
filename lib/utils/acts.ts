export type { ActRow } from "../db/acts";
export type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};