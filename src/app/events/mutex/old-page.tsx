import React from "react";
import { Metadata } from "next";
import { eventsData } from "@/data/events";
import { Flex } from "@chakra-ui/react";
import HeroSection from "@/components/ui/internal/events/mutex/hero-section";
import Competitions from "@/components/ui/internal/events/mutex/competitions";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import ImageBox from "@/components/ui/internal/image-box";
import LeadersContainer from "@/components/ui/internal/leaders-container";
import AlternativeText from "@/components/ui/internal/alternative-text";

const event = eventsData.find((event) => event.slug?.toLowerCase() === "mutex");

export const generateMetadata = (): Metadata => {
  return {
    title: event?.name || "Event",
  };
};

export default function Page() {
  return (
    <PageWrapper>
      <Flex
        flexDirection={"column"}
        alignItems="center"
        justifyContent="center"
        gap={20}
        maxWidth={"1300px"}
        mx={"auto"}
        mb={16}
      >
        <HeroSection
          title="Mutex"
          description={event?.description || "Mutex Event Description"}
          imagePath={event?.image || "/events/mutex/mutex-2024.webp"}
          buttonLink={event?.registerLink || "https://bit.ly/MUTEX_SUMMIT_25"}
        />

        <SectionContainer>
          <SectionTitle title="Overview" />
          <SectionDescription
            description={event?.overview || "No description available"}
          />
        </SectionContainer>

        {event && (
          <Competitions
            eventSlug={event.slug || "mutex"}
            competitionsDescription={event.competitionsDescription}
          />
        )}

        <SectionContainer>
          <SectionTitle title="Speakers" />
          <SectionDescription
            description={event?.speakersDescription || "No speakers available"}
          />
          {event?.speakers && event.speakers.length > 0 ? (
            <LeadersContainer positions={event.speakers} />
          ) : (
            <AlternativeText text="Stay tuned for our speakers announcements!" />
          )}
        </SectionContainer>

        <SectionContainer>
          <SectionTitle title="Sponsors" />
          <SectionDescription
            description={event?.sponsorsDescription || "No sponsors available"}
          />
          {event?.sponsors && event.sponsors.length > 0 ? (
            <Flex width="full" flexWrap="wrap" gap={4} justifyContent="center">
              {event.sponsors.map((sponsor) => (
                <ImageBox
                  key={sponsor.id}
                  path={sponsor.image}
                  alt={`Sponsor: ${sponsor.id}`}
                  aspectRatio="1/1"
                  maxWidth="200px"
                />
              ))}
            </Flex>
          ) : (
            <AlternativeText text="Stay tuned for our sponsors announcements!" />
          )}
        </SectionContainer>
      </Flex>
    </PageWrapper>
  );
}
