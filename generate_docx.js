import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          text: "TrancheChain — Viva Presentation Script",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This script is designed for your PGDM Fintech course viva presentation. Follow these steps to demonstrate the TrancheChain application effectively.",
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),
        
        // Phase 1
        new Paragraph({ text: "Phase 1: The Trust Gap (Landing Page)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the Home page." }),
        new Paragraph({ text: "2. The Problem: In current workflows, NBFCs, lending platforms (like GrayQuest), and institutions maintain siloed ledgers." }),
        new Paragraph({ text: "3. Risks: This leads to trust gaps, double-disbursement risks, and backdating risks." }),
        new Paragraph({ text: "4. The Solution: A shared, append-only, tamper-evident ledger where every handoff is provable.", spacing: { after: 200 } }),

        // Phase 2
        new Paragraph({ text: "Phase 2: Educational Foundation (How It Works)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the 'How It Works' page." }),
        new Paragraph({ text: "2. What is a Hash?: Show the live input box. Type '₹18,000 | Arka Fincap' and show how the SHA-256 hash changes instantly with every keystroke. Explain that this is the 'digital fingerprint'." }),
        new Paragraph({ text: "3. What is a Block?: Show how a tranche is bundled with a timestamp and a previous hash." }),
        new Paragraph({ text: "4. Chaining Blocks: Explain that the previous hash is the glue. Changing Block 2 changes its hash, which breaks Block 3's reference.", spacing: { after: 200 } }),

        // Phase 3
        new Paragraph({ text: "Phase 3: Cryptographic Identity (Signatures)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the 'Signatures' page." }),
        new Paragraph({ text: "2. Generate Keys: Click to generate a fresh pair. Explain the private key (kept secret by NBFC) vs. public key (shared openly)." }),
        new Paragraph({ text: "3. Sign Tranche: Click to sign. The private key and message combine to form the 'wax seal'." }),
        new Paragraph({ text: "4. Verify: Click verify. Explain that anyone can verify this using ONLY the public key." }),
        new Paragraph({ text: "5. Tamper: Alter the amount in the input field and click verify. Show it failing because the signature is bound to the original message.", spacing: { after: 200 } }),

        // Phase 4
        new Paragraph({ text: "Phase 4: The Live Ledger (Interactive Chain)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the 'Ledger' page." }),
        new Paragraph({ text: "2. Core Concept: This is the core ledger tracking Loan EDU-2024-001. Point out the Genesis block and the chaining hashes." }),
        new Paragraph({ text: "3. Add a Block: Use the sidebar to simulate a new disbursement. Emphasize the 'Computing' and 'Signing' shimmers." }),
        new Paragraph({ text: "4. Attempt Double-Disbursement: Try to add the same milestone again. Show the system rejecting it." }),
        new Paragraph({ text: "5. Tamper & Cascade: Click 'Tamper' on Block 2. Change the amount to ₹50,000. Watch the red pulse travel down the chain, invalidating subsequent blocks. Explain that the chain successfully detected historical tampering.", spacing: { after: 200 } }),

        // Phase 5
        new Paragraph({ text: "Phase 5: High-Drama Presentation (Tamper Test)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the 'Tamper Test' page." }),
        new Paragraph({ text: "2. Demo: Click 'Attempt Tampering' and step back. Let the animation run automatically." }),
        new Paragraph({ text: "3. Conclude: 'This is Layer 2 security. History cannot be silently rewritten.'", spacing: { after: 200 } }),

        // Phase 6
        new Paragraph({ text: "Phase 6: Decentralized Consensus (Dashboard)", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "1. Navigate to the 'Dashboard' page." }),
        new Paragraph({ text: "2. Network View: Show the three distinct nodes (NBFC, GrayQuest, Institution) maintaining the same state." }),
        new Paragraph({ text: "3. Simulate Tamper: Click the demo button to simulate a tamper attempt at the NBFC node." }),
        new Paragraph({ text: "4. Consensus: Watch only the NBFC node's ledger turn red. Point to the discrepancy banner." }),
        new Paragraph({ text: "5. Conclude: 'No single party, not even the originating NBFC, can unilaterally alter the record. The network enforces consensus.'", spacing: { after: 200 } }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("TrancheChain_Viva_Script.docx", buffer);
  console.log("Document created successfully in the project directory");
});
