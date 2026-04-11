import { Metadata } from "next";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { eventsData } from "@/data/events";
import { Box, Flex, Text } from "@chakra-ui/react";
import HeroSection from "@/components/ui/internal/events/mutex/hero-section";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import NavButton from "@/components/ui/internal/nav-button";
import AlternativeText from "@/components/ui/internal/alternative-text";
import PrizesSection from "@/components/ui/internal/events/mutex/prizes-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const event = eventsData.find((event) =>
    event.competitions.some(
      (competition) => competition.shortName.toLowerCase() === id.toLowerCase()
    )
  );

  const competition = event?.competitions.find(
    (comp) => comp.shortName.toLowerCase() === id.toLowerCase()
  );

  return {
    title: competition?.name || "Competition Not Found",
    description: competition?.description || "Details of the competition",
  };
}

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = eventsData.find((event) =>
    event.competitions.some(
      (competition) => competition.shortName.toLowerCase() === id.toLowerCase()
    )
  );

  const competition = event?.competitions.find(
    (comp) => comp.shortName.toLowerCase() === id.toLowerCase()
  );

  if (!event || !competition) {
    return <div>Competition not found</div>;
  }

  const maxAmount = 20000;

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
          title={competition.name}
          description={competition.description}
          imagePath={competition.image}
          buttonLink={event.registerLink || event.link}
          ruleBook={competition.rulebook}
        />

        <SectionContainer>
          <SectionTitle title="Overview" />
          <SectionDescription
            description={competition.overview || "No description available"}
          />
        </SectionContainer>

        <SectionContainer>
          <SectionTitle title="Trophies" />
          <SectionDescription description={competition.trophiesDescription} />
          {competition.trophies && competition.trophies.length > 0 ? (
            <Flex flexWrap="wrap" justify="center" align="end" gap={8} mt={10}>
              {competition.trophies.map((trophy) => {
                const amount = parseInt(trophy.amount.replace(/[^\d]/g, ""));
                const height = (amount / maxAmount) * 400;

                let bgColor;
                if (trophy.place === "1st") bgColor = "primary-1";
                else if (trophy.place === "2nd") bgColor = "primary-3";
                else if (trophy.place === "3rd") bgColor = "primary-11";
                else bgColor = "primary-10";

                return (
                  <Flex key={trophy.id} direction="column" align="center">
                    <Text
                      fontWeight="bold"
                      color="neutral-1"
                      fontSize={"2xl"}
                      mb={2}
                    >
                      {trophy.amount}
                    </Text>
                    <Box
                      width="170px"
                      height={`${height}px`}
                      rounded="xl"
                      bg={bgColor}
                      transition="height 0.3s ease"
                    />
                    <Text color="neutral-2" mt={2}>
                      {trophy.place} place
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          ) : (
            <AlternativeText text="Stay tuned for our trophies announcements!" />
          )}
        </SectionContainer>

        {competition.certificates && competition.certificates.length > 0 && (
          <SectionContainer>
            <SectionTitle title="Certificates" />
            <SectionDescription description="Certificates will be awarded to the top three teams in each competition." />

            <Flex direction="column" align="flex-start" gap={4} mt={10}>
              {competition.certificates?.map((certificate, index) => {
                const barWidths = [100, 150, 200];
                const width = barWidths[index] || 150;

                return (
                  <Flex
                    flexWrap="wrap"
                    key={certificate.id}
                    align="center"
                    gap={4}
                  >
                    <Box
                      width={`${width}px`}
                      height="30px"
                      bg="primary-1"
                      rounded="md"
                      transition="width 0.3s ease"
                    />
                    <Text
                      fontWeight="bold"
                      color="neutral-1"
                      whiteSpace="nowrap"
                    >
                      {certificate.title}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </SectionContainer>
        )}

        <PrizesSection
          competitionId={competition.id}
          description={competition.trophiesDescription}
        />

        {competition.rulebook && (
          <SectionContainer>
            <SectionTitle title="Rules" />
            <SectionDescription description={competition.rulesDescription} />
            <NavButton
              link={competition.rulebook}
              text="View Rule-book"
              bgColor="primary-8"
              color="neutral-5"
            />
          </SectionContainer>
        )}

        <SectionContainer>
          <SectionDescription
            description={"What you're waiting? Register now!"}
          />
          <NavButton link={event.registerLink} text="Register Now" />
        </SectionContainer>
      </Flex>
    </PageWrapper>
  );
}


