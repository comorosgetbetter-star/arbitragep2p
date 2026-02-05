import { FileCheck } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   Dialog,
   DialogContent,
   DialogTrigger,
 } from '@/components/ui/dialog';
import stampAuthorized from '@/assets/stamp-authorized.png';
import sealGold from '@/assets/seal-gold.png';
import signature1 from '@/assets/signature-1.png';
import signature2 from '@/assets/signature-2.png';
 
 export const AuthorizationLetter = () => {
   return (
    <Dialog>
       <DialogTrigger asChild>
         <Button
           variant="outline"
           className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
         >
           <FileCheck className="h-4 w-4 text-primary" />
           View Operating License
         </Button>
       </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-0">
        {/* PDF-like document container */}
        <div 
          className="relative bg-white shadow-2xl"
          style={{
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f6f1 100%)',
            fontFamily: "'Times New Roman', Georgia, serif",
          }}
        >
          {/* Subtle paper texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative border */}
          <div className="absolute inset-3 border-2 border-[#c9a227]/30 pointer-events-none" />
          <div className="absolute inset-4 border border-[#c9a227]/20 pointer-events-none" />

          {/* Document Content */}
          <div className="relative p-10 sm:p-12 text-[#1a1a2e]">
            {/* Gold seal in corner */}
            <div className="absolute top-6 right-6 w-20 h-20 opacity-90">
              <img src={sealGold} alt="Certified Seal" className="w-full h-full object-contain" />
            </div>

            {/* Letterhead */}
            <div className="text-center border-b-2 border-[#1a1a2e]/20 pb-6 mb-8">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#8b6914] flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">₮</span>
                </div>
                <div>
                  <h1 
                    className="text-2xl sm:text-3xl font-bold tracking-wide text-[#1a1a2e]"
                    style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                  >
                    ARBITRAGE P2P EXCHANGE
                  </h1>
                  <p className="text-xs text-[#1a1a2e]/60 tracking-[0.3em] uppercase mt-1">
                    Digital Asset Exchange Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 
                className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-[#1a1a2e] mb-3"
                style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
              >
                Certificate of Authorization
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm text-[#1a1a2e]/70">
                <span>License No: <strong>APE-2024-00847-INT</strong></span>
                <span className="w-1 h-1 rounded-full bg-[#1a1a2e]/40" />
                <span>Reg. ID: <strong>DFA-7829-2024</strong></span>
              </div>
            </div>

            {/* Body */}
            <div 
              className="space-y-4 text-sm leading-relaxed text-[#1a1a2e]/85 mb-8 text-justify"
              style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
            >
              <p className="first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:text-[#1a1a2e]">
                This is to certify that <strong className="text-[#1a1a2e]">Arbitrage P2P Exchange</strong> has been 
                duly authorized and licensed to operate as a peer-to-peer digital asset exchange 
                platform in accordance with the applicable international regulatory frameworks and 
                financial compliance standards.
              </p>
              <p>
                The aforementioned platform is hereby granted authorization to facilitate the exchange 
                of digital assets including but not limited to USDT (Tether), Bitcoin, Ethereum, and 
                other approved cryptocurrencies through secure peer-to-peer transactions within the 
                jurisdictions where such activities are legally permitted.
              </p>
              <p>
                This authorization is granted upon verification that the platform maintains and adheres to:
              </p>
              <ul className="list-none space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a227] mt-1">✦</span>
                  <span>Robust security protocols including 256-bit SSL encryption standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a227] mt-1">✦</span>
                  <span>Comprehensive Know Your Customer (KYC) and Anti-Money Laundering (AML) compliance procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a227] mt-1">✦</span>
                  <span>Secure escrow mechanisms for complete transaction protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a227] mt-1">✦</span>
                  <span>Regular third-party security audits and vulnerability assessments</span>
                </li>
              </ul>
            </div>

            {/* Validity Box */}
            <div className="border border-[#1a1a2e]/20 rounded bg-[#f5f3ee] p-5 mb-10">
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-[#1a1a2e]/50 text-xs uppercase tracking-wider mb-1">Date of Issue</p>
                  <p className="font-semibold text-[#1a1a2e]" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    January 15, 2024
                  </p>
                </div>
                <div>
                  <p className="text-[#1a1a2e]/50 text-xs uppercase tracking-wider mb-1">Valid Until</p>
                  <p className="font-semibold text-[#1a1a2e]" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    January 14, 2026
                  </p>
                </div>
                <div>
                  <p className="text-[#1a1a2e]/50 text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="font-semibold text-green-700" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    ACTIVE
                  </p>
                </div>
              </div>
            </div>

            {/* Signatures and Stamps Section */}
            <div className="relative flex justify-between items-end pt-6 border-t-2 border-[#1a1a2e]/10">
              {/* Left Signature */}
              <div className="text-center flex-1">
                <div className="h-16 flex items-end justify-center mb-1">
                  <img 
                    src={signature1} 
                    alt="Signature" 
                    className="h-12 object-contain opacity-90"
                  />
                </div>
                <div className="border-t border-[#1a1a2e]/40 pt-2 mx-4">
                  <p className="text-xs font-bold text-[#1a1a2e]" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    Robert A. Morrison
                  </p>
                  <p className="text-[10px] text-[#1a1a2e]/60">Director of Compliance</p>
                </div>
              </div>

              {/* Center Stamp */}
              <div className="flex-shrink-0 mx-4">
                <div className="relative w-28 h-28 -rotate-12">
                  <img 
                    src={stampAuthorized} 
                    alt="Authorized Stamp" 
                    className="w-full h-full object-contain opacity-85"
                  />
                </div>
              </div>

              {/* Right Signature */}
              <div className="text-center flex-1">
                <div className="h-16 flex items-end justify-center mb-1">
                  <img 
                    src={signature2} 
                    alt="Signature" 
                    className="h-12 object-contain opacity-90"
                  />
                </div>
                <div className="border-t border-[#1a1a2e]/40 pt-2 mx-4">
                  <p className="text-xs font-bold text-[#1a1a2e]" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    James T. Chen
                  </p>
                  <p className="text-[10px] text-[#1a1a2e]/60">Chief Executive Officer</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-[#1a1a2e]/10 text-center space-y-2">
              <p className="text-[10px] text-[#1a1a2e]/50">
                This document is digitally verified and tamper-proof. Document ID: APE-CERT-2024-00847-A7B9C2D4
              </p>
              <p className="text-[9px] text-[#1a1a2e]/40">
                Unauthorized reproduction, alteration, or distribution of this certificate is strictly prohibited and may be subject to legal action.
              </p>
            </div>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };