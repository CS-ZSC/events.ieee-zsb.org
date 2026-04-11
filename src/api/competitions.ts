import api from ".";

export interface ApiCompetition {
  id: number;
  name: string;
  short_name: string;
  description: string;
  overview: string;
  image: string;
  link: string;
  rulebook: string | null;
  trophies_description: string;
  rules_description: string;
}

export interface ApiPrize {
  id: number;
  place: string;
  amount: string;
}

interface ApiResponse<T> {
  message: string;
  data: T;
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