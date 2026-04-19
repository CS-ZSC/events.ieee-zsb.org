import api from ".";

// --- Types ---

interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar_src: string | null;
  join_code: string | null;
  phone_number: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiEventParticipantWithUser {
  id: number;
  user_id: number;
  event_id: number;
  role: string;
  created_at: string;
  updated_at: string;
  user: ApiUser;
}

export interface ApiTeamMember {
  id: number;
  team_id: number;
  event_participant_id: number;
  created_at: string;
  updated_at: string;
  event_participant: ApiEventParticipantWithUser;
}

export interface ApiTeam {
  id: number;
  competition_id: number;
  leader_event_participant_id: number;
  name: string;
  join_code: string;
  created_at: string;
  updated_at: string;
  members: ApiTeamMember[];
  leader_event_participant: ApiEventParticipantWithUser;
}

// --- API Functions ---

export async function getTeams(competitionId: number): Promise<ApiTeam[]> {
  const { data } = await api.get<ApiResponse<ApiTeam[]>>(
    `/eventsgate/competitions/${competitionId}/teams`
  );
  return data.data;
}

export async function getTeam(competitionId: number, teamId: number): Promise<ApiTeam> {
  const { data } = await api.get<ApiResponse<ApiTeam>>(
    `/eventsgate/competitions/${competitionId}/teams/${teamId}`
  );
  return data.data;
}

export async function getMyTeam(competitionId: number): Promise<ApiTeam> {
  const { data } = await api.get<ApiResponse<ApiTeam>>(
    `/eventsgate/competitions/${competitionId}/teams/my-team`
  );
  return data.data;
}

export async function createTeam(competitionId: number, name: string): Promise<ApiTeam> {
  const { data } = await api.post<ApiResponse<ApiTeam>>(
    `/eventsgate/competitions/${competitionId}/teams`,
    { name }
  );
  return data.data;
}

export async function joinTeam(competitionId: number, joinCode: string): Promise<ApiTeamMember> {
  const { data } = await api.post<ApiResponse<ApiTeamMember>>(
    `/eventsgate/competitions/${competitionId}/teams/join`,
    { join_code: joinCode }
  );
  return data.data;
}

export async function leaveTeam(competitionId: number): Promise<void> {
  await api.delete(`/eventsgate/competitions/${competitionId}/teams/leave`);
}

export async function addMember(competitionId: number, joinCode: string): Promise<ApiTeamMember> {
  const { data } = await api.post<ApiResponse<ApiTeamMember>>(
    `/eventsgate/competitions/${competitionId}/teams/add-member`,
    { join_code: joinCode }
  );
  return data.data;
}

export async function removeMember(competitionId: number, joinCode: string): Promise<void> {
  await api.post(
    `/eventsgate/competitions/${competitionId}/teams/remove-member`,
    { join_code: joinCode }
  );
}
