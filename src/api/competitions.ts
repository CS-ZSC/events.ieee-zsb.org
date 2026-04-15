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