import { Metadata } from "next";
import ProposalContent from "./ProposalContent";

export const metadata: Metadata = {
  title: "MSP Platform — Technical Proposal",
  description:
    "A comprehensive technical proposal for the MSP + Real Estate Operations Platform, detailing architecture, integrations, modules, and implementation strategy.",
};

export default function ProposalPage() {
  return <ProposalContent />;
}
