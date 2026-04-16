import api from ".";

export interface ApiCompetition {
  id: number;
  event_id: number;
  chapter_id: number;
  name: string;
  overview: string;
  type: "individual" | "team";
  max_team_members: number;
  created_at: string;
  updated_at: string;
  prizes: ApiPrize[];
}

export interface ApiPrize {
  id: number;
  competition_id: number;
  title: string;
  rank: number;
  prize_description: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

const CHAPTER_LOGOS: Record<number, string> = {
  1: "/images/cs/CS-White.svg",
  2: "/images/pes/PES-White.svg",
  3: "/images/ras/RAS-White.svg",
  4: "/images/wie/WIE-White.svg",
};

export function getChapterLogo(chapterId: number): string {
  return CHAPTER_LOGOS[chapterId] || "/images/ieee/ieee-logo-white.svg";
}

export async function getCompetitions() {
  try {
    const { data } = await api.get<ApiResponse<ApiCompetition[]>>(
      "/eventsgate/competitions"
    );
    return data.data;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    throw error;
  }
}

export async function getCompetitionById(id: number) {
  try {
    const { data } = await api.get<ApiResponse<ApiCompetition>>(
      `/eventsgate/competitions/${id}`
    );
    return data.data;
  } catch (error) {
    console.error(`Error fetching competition with id ${id}:`, error);
    throw error;
  }
}

export async function getCompetitionPrizes(competitionId: number) {
  try {
    const { data } = await api.get<ApiResponse<ApiPrize[]>>(
      `/eventsgate/competitions/${competitionId}/prizes`
    );
    return data.data;
  } catch (error) {
    console.error(`Error fetching prizes for competition ${competitionId}:`, error);
    throw error;
  }
}

// --- Competition Registration ---

export interface CompetitionParticipant {
  id: number;
  competition_id: number;
  event_participant_id: number;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: number;
  event_id: number;
  user_id: number;
  role: "competitor" | "spectator";
  created_at: string;
  updated_at: string;
}


export async function registerForCompetition(competitionId: number) {
  const { data } = await api.post<ApiResponse<CompetitionParticipant>>(
    `/eventsgate/competitions/${competitionId}/register`
  );
  return data;
}


export async function unregisterFromCompetition(competitionId: number) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/eventsgate/competitions/${competitionId}/unregister`
  );
  return data;
}


export async function ensureEventRegistration(eventSlug: string): Promise<EventParticipant> {
  try {
    const { data } = await api.post<ApiResponse<EventParticipant>>(
      `/eventsgate/events/${eventSlug}/register`,
      { role: "spectator" }
    );
    return data.data;
  } catch (error: any) {
    // 409 = already registered — extract participant data from response
    if (error.response?.status === 409 && error.response?.data?.data) {
      return error.response.data.data as EventParticipant;
    }
    throw error;
  }
}

export async function isUserRegisteredForCompetition(competitionId: number, userId: number): Promise<boolean> {
  try {
    const { data } = await api.get<ApiResponse<{ event_participant: { user_id: number } }[]>>(
      `/eventsgate/competitions/${competitionId}/participants`
    );
    const participants = data.data || [];
    return participants.some((p) => p.event_participant?.user_id === userId);
  } catch {
    return false;
  }
}