 import { useState } from 'react';
 import { FileCheck, Shield, Award } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 
 export const AuthorizationLetter = () => {
   const [isOpen, setIsOpen] = useState(false);
 
   return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       <DialogTrigger asChild>
         <Button
           variant="outline"
           className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
         >
           <FileCheck className="h-4 w-4 text-primary" />
           View Operating License
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-[#faf8f5]">
         <div className="relative">
           {/* Document Header with watermark pattern */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
             <div className="absolute inset-0" style={{
               backgroundImage: `repeating-linear-gradient(45deg, #1a1a2e 0, #1a1a2e 1px, transparent 0, transparent 50%)`,
               backgroundSize: '10px 10px'
             }} />
           </div>
 
           {/* Document Content */}
           <div className="relative p-8 text-[#1a1a2e]">
             {/* Letterhead */}
             <div className="text-center border-b-2 border-[#1a1a2e]/20 pb-6 mb-6">
               <div className="flex items-center justify-center gap-3 mb-2">
                 <Shield className="h-8 w-8 text-[#c9a227]" />
                 <h1 className="text-2xl font-bold tracking-wide text-[#1a1a2e]">
                   ARBITRAGE P2P EXCHANGE
                 </h1>
                 <Shield className="h-8 w-8 text-[#c9a227]" />
               </div>
               <p className="text-sm text-[#1a1a2e]/60 tracking-widest uppercase">
                 Digital Asset Exchange Platform
               </p>
             </div>
 
             {/* Title */}
             <div className="text-center mb-8">
               <h2 className="text-xl font-bold uppercase tracking-wider text-[#1a1a2e] mb-2">
                 Certificate of Authorization
               </h2>
               <p className="text-sm text-[#1a1a2e]/60">
                 License No: APE-2024-00847-INT
               </p>
             </div>
 
             {/* Body */}
             <div className="space-y-4 text-sm leading-relaxed text-[#1a1a2e]/80 mb-8">
               <p>
                 This is to certify that <strong className="text-[#1a1a2e]">Arbitrage P2P Exchange</strong> has been 
                 duly authorized and licensed to operate as a peer-to-peer digital asset exchange 
                 platform in accordance with the applicable regulatory frameworks.
               </p>
               <p>
                 The platform is authorized to facilitate the exchange of digital assets including 
                 but not limited to USDT (Tether), and other approved cryptocurrencies through 
                 secure peer-to-peer transactions.
               </p>
               <p>
                 This authorization is granted upon verification that the platform maintains:
               </p>
               <ul className="list-disc list-inside space-y-1 ml-4">
                 <li>Robust security protocols and encryption standards</li>
                 <li>Comprehensive KYC/AML compliance procedures</li>
                 <li>Secure escrow mechanisms for transaction protection</li>
                 <li>Regular security audits and vulnerability assessments</li>
               </ul>
             </div>
 
             {/* Validity */}
             <div className="bg-[#1a1a2e]/5 rounded-lg p-4 mb-8">
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <p className="text-[#1a1a2e]/60 text-xs uppercase tracking-wide">Issue Date</p>
                   <p className="font-semibold text-[#1a1a2e]">January 15, 2024</p>
                 </div>
                 <div>
                   <p className="text-[#1a1a2e]/60 text-xs uppercase tracking-wide">Valid Until</p>
                   <p className="font-semibold text-[#1a1a2e]">January 14, 2026</p>
                 </div>
               </div>
             </div>
 
             {/* Signatures and Stamps */}
             <div className="flex justify-between items-end pt-4 border-t border-[#1a1a2e]/10">
               {/* Left Signature */}
               <div className="text-center">
                 <div className="mb-2 h-12 flex items-end justify-center">
                   <span className="font-['Brush_Script_MT',cursive] text-2xl italic text-[#1a1a2e]/70">
                     R. Morrison
                   </span>
                 </div>
                 <div className="w-32 border-t border-[#1a1a2e]/40 pt-1">
                   <p className="text-xs font-semibold text-[#1a1a2e]">R. Morrison</p>
                   <p className="text-[10px] text-[#1a1a2e]/60">Compliance Director</p>
                 </div>
               </div>
 
               {/* Center Stamp */}
               <div className="relative">
                 <div className="w-24 h-24 rounded-full border-4 border-[#b91c1c] flex items-center justify-center rotate-[-12deg] opacity-80">
                   <div className="w-20 h-20 rounded-full border-2 border-[#b91c1c] flex flex-col items-center justify-center p-2">
                     <Award className="h-5 w-5 text-[#b91c1c] mb-1" />
                     <span className="text-[8px] font-bold text-[#b91c1c] text-center uppercase leading-tight">
                       AUTHORIZED
                     </span>
                     <span className="text-[6px] text-[#b91c1c] text-center">
                       2024
                     </span>
                   </div>
                 </div>
               </div>
 
               {/* Right Signature */}
               <div className="text-center">
                 <div className="mb-2 h-12 flex items-end justify-center">
                   <span className="font-['Brush_Script_MT',cursive] text-2xl italic text-[#1a1a2e]/70">
                     J. Chen
                   </span>
                 </div>
                 <div className="w-32 border-t border-[#1a1a2e]/40 pt-1">
                   <p className="text-xs font-semibold text-[#1a1a2e]">J. Chen</p>
                   <p className="text-[10px] text-[#1a1a2e]/60">Chief Executive Officer</p>
                 </div>
               </div>
             </div>
 
             {/* Footer Note */}
             <div className="mt-8 pt-4 border-t border-[#1a1a2e]/10 text-center">
               <p className="text-[10px] text-[#1a1a2e]/50">
                 This document is digitally verified and tamper-proof. 
                 Any unauthorized reproduction is strictly prohibited.
               </p>
             </div>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };