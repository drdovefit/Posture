/**
 * The legal documents shown in the app, and the acceptance version.
 *
 * Bump LEGAL_VERSION whenever the Terms or Privacy Policy change in a way that
 * needs fresh consent. Every user whose accepted version is lower than this is
 * asked to agree again before they can keep using PostureLab (see ConsentGate).
 */
export const LEGAL_VERSION = 1;

export const LEGAL_EFFECTIVE = 'September 1, 2026';

export const TERMS_HTML = `
<h1>PostureLab — Terms of Service</h1>
<p class="meta"><b>Effective:</b> September 1, 2026 &nbsp;·&nbsp; <b>Provider:</b> PostureLab (Toronto, Ontario, Canada) &nbsp;·&nbsp; <b>Contact:</b> drdovefit@gmail.com</p>
<p>This is the agreement between you and PostureLab. By ticking "I agree" and creating an account, or by using the app, you accept these Terms and the Privacy Policy. If you do not agree, do not use PostureLab. Please read these Terms in full before you agree.</p>

<h2>1. Agreement to these Terms</h2>
<p>These Terms of Service ("Terms") are a binding agreement between you and PostureLab (the "app," "service," "we," "us," "our"). By creating an account or using the service, you accept these Terms and our Privacy Policy. You confirm the details you give us are true and that you may enter this agreement.</p>

<h2>2. Definitions</h2>
<ul>
  <li><b>Account</b> — the profile you create to use the service.</li>
  <li><b>Content</b> — anything you add, including photos, posture scans, measurements, notes, and messages.</li>
  <li><b>Membership</b> — a paid plan that unlocks extra features or content.</li>
  <li><b>Scan</b> — a posture estimate the app produces from a photo you provide.</li>
</ul>

<h2>3. Who can use PostureLab</h2>
<p>You must be at least 13 years old to create an account. We do not knowingly allow anyone under 13 to use PostureLab or collect information from them, and if we learn that we have, we will delete it.</p>
<p>If you are 13 or older but under the age of majority where you live (often 18), you may create and use an account only if a parent or guardian has reviewed and agreed to these Terms and permits your use. By creating an account, you confirm that you meet this requirement and that a parent or guardian has given that permission. A parent or guardian may contact us at any time to review, or to ask us to delete, their child's account and data.</p>
<p>You may not use the service if the law where you live prevents it, or if we have previously removed your access.</p>

<h2>4. Your account</h2>
<p>Keep your login details private and do not let anyone else use your account. You are responsible for everything that happens under it. Tell us promptly if you believe your account has been accessed without your permission. You may close your account at any time. We may keep limited records after closure where the law requires it.</p>

<h2>5. Your licence to use the app</h2>
<p>While these Terms are in force and you follow them, we grant you a personal, limited, non-exclusive, non-transferable, revocable licence to use PostureLab for your own, non-commercial use. You may not copy, sell, rent, or redistribute the app or its content; modify, translate, or create derivative works from it; reverse-engineer or try to extract its source code or models, except as the law allows; remove any ownership notice; or use the service to build a competing product. All rights not expressly granted to you are reserved by us.</p>

<h2>6. The service, and changes to it</h2>
<p>We may add, change, limit, or remove features, content, and membership tiers, and we may set or change the price of paid features, at any time and at our discretion. We may run the service differently for different users, for example while testing. We will try to give notice of significant changes, but we are not required to keep any particular feature available, and we are not liable to you for changing or discontinuing part of the service. If a change materially reduces a paid feature you are actively paying for, your remedy is in section 14.</p>

<h2>7. Health, fitness &amp; assumption of risk</h2>
<p><b>PostureLab is an educational and self-tracking tool. It is not a medical device, and it does not provide medical advice, diagnosis, or treatment.</b></p>
<p>The scores, measurements, and exercise suggestions are general information. They are estimates generated from a photo, they can be wrong or imprecise, and they are not a professional assessment of your body or health. They are not a substitute for advice, diagnosis, or care from a physician, physiotherapist, or other qualified professional. Never disregard or delay professional advice because of something you saw in PostureLab.</p>
<p>Consult a qualified professional before starting any exercise, stretch, or routine the app suggests, especially if you are pregnant or postpartum, recovering from surgery or injury, living with a diagnosed condition, or in pain. If any activity causes pain or discomfort, stop immediately and seek help. For a medical emergency, contact your local emergency service.</p>
<p>You take part in any physical activity connected with PostureLab entirely of your own free will. You understand exercise carries inherent risks, including strain, injury, and in rare cases serious harm, and you accept those risks. To the fullest extent permitted by law, you release PostureLab and the people behind it from any claim arising out of your use of the app's health and fitness information or your participation in any activity it suggests.</p>

<h2>8. Your content &amp; your privacy</h2>
<p>Your Content stays yours. We do not claim ownership of your photos, scans, or notes, we do not sell them, and we do not share them with other users.</p>
<p><b>Your scans and photos are private to your account. We do not look at them, and no other member can see them.</b> So the app can work, you give us permission for our systems to automatically store, copy, back up, and sync your Content to your account across your devices, and to show it back to you. We access your Content ourselves only when we genuinely need to — for example to help with a problem you ask us to look into, to keep the service safe, or where the law requires it — and we will never publish it or use it to promote PostureLab without your separate, specific permission.</p>
<p>This permission is limited to running the service for you. It lasts only as long as we hold the Content to provide the service, and ends within a reasonable period after you delete it or close your account, apart from routine backups or copies required by law. You are responsible for your Content and confirm you have the rights to it.</p>

<h2>9. Photos of the body</h2>
<p>PostureLab works from photos, which may show your body. Only upload a photo of yourself, or of another person who has clearly agreed to it. Never upload a photo of a child who is not in your care. The app detects body landmarks to calculate posture; it does not use your photos for facial recognition or to identify you to anyone else. Where the law treats body or biometric information as sensitive, we handle it accordingly, as described in our Privacy Policy.</p>

<h2>10. How your information is stored, and security</h2>
<p>PostureLab is built local-first. Without an account, your scans and notes are saved on your own device. When you sign in, your data is also saved to your private account so it can sync to your other devices. This is stored using established cloud infrastructure (Google Firebase / Google Cloud), sent over encrypted connections, and kept in an area tied to your account, so one account cannot read another's data. If you switch accounts or sign out on a device, the local copy for the previous account is cleared from that device. You can delete individual scans, and deleting your account removes your stored scans, pain entries, and profile from your account, apart from routine backups for a limited period or records the law requires us to keep. Our Privacy Policy explains what we collect, why, how long we keep it, and your choices.</p>
<p><b>Your profile ("About you") details are private to your account and are not shown to other members.</b> This is how the service works today. We may change how the service handles information in the future. If a change is material, it will come to you through an updated Terms of Service or Privacy Policy, and you will be asked to agree to it before you continue using the app.</p>
<p><b>Security.</b> No app or online service can be completely secure. We take reasonable steps to protect your information, but we cannot and do not guarantee its security, and you provide your Content and use the service at your own risk. To the fullest extent permitted by law, we are not liable for any unauthorized access to, or any loss, theft, disclosure, or leak of, your Content or personal information — including your photos and profile details — caused by hacking, a security breach, or the act of any third party, even if that information becomes public as a result. Nothing in this section removes any right you have under data-protection law that cannot be waived.</p>
<p><b>International use and data transfer.</b> PostureLab is operated from Canada. Wherever you use it, your information may be stored and processed in Canada and in other countries where we or our service providers operate, which may have different data-protection laws than your own. By using the service, you consent to that transfer and processing. If you use PostureLab from outside Canada, you are responsible for following the laws that apply to you, and you may have additional rights under your local law — for example under the GDPR in the European Union, the LGPD in Brazil, PIPEDA in Canada, or state privacy laws in the United States. We honor those rights where they apply to you, and our Privacy Policy explains how to exercise them.</p>

<h2>11. Privacy</h2>
<p>Our Privacy Policy explains how we collect, use, and protect your information, and it forms part of these Terms. By agreeing to these Terms, you also agree to the Privacy Policy. Where the two touch the same topic, the Privacy Policy governs how your personal information is handled.</p>

<h2>12. Acceptable use</h2>
<p>When you use PostureLab, you agree that you will not:</p>
<ul>
  <li>break the law, or use the service to harm, harass, threaten, or invade the privacy of anyone;</li>
  <li>upload content that is unlawful, hateful, sexual involving minors, or that you have no right to share;</li>
  <li>impersonate another person or misrepresent who you are;</li>
  <li>upload another person's photo or scan without their permission;</li>
  <li>interfere with, overload, or disrupt the service or its servers;</li>
  <li>try to gain unauthorized access to any account, system, or data;</li>
  <li>scrape or collect data from the service by automated means without our written permission; or</li>
  <li>use the service to build or train a competing product.</li>
</ul>
<p>We may remove content or limit access if we reasonably believe these rules have been broken.</p>

<h2>13. Community areas</h2>
<p>PostureLab and its associated programs may include community areas where members share progress and ask questions. Anything you post there, you post at your own choice, and you allow us to display it as part of running that community. Treat other members with respect. Do not post someone else's scan, photo, or personal details without their permission. We may moderate, remove, or restrict community content, but we are not obliged to review everything and are not responsible for what members post.</p>

<h2>14. Memberships &amp; billing</h2>
<p>Some features are free. Others require a paid membership (Premium). If you buy one, you agree to the price and billing cycle shown at checkout.</p>
<p><b>Auto-renewal.</b> Paid memberships renew automatically at the end of each cycle at the then-current price, until you cancel. You authorize us and our payment provider to charge your payment method for each renewal.</p>
<p><b>Cancellation.</b> You can cancel any time; it takes effect at the end of the current cycle, and you keep access until then. We do not provide partial-period refunds.</p>
<p><b>Refunds and price changes.</b> Except where the law requires otherwise, payments are non-refundable. We may change prices; a change will not affect the cycle you have already paid for, and we will give notice before it applies to your next renewal.</p>
<p><b>Payment provider.</b> Payments are processed by our payment provider under its own terms. We do not store full card details.</p>

<h2>15. Trials &amp; promotions</h2>
<p>We may offer free trials or promotional pricing. Unless we say otherwise, a free trial converts into a paid membership at the end of the trial and your payment method is charged, unless you cancel before it ends. Promotions may have extra rules, which we will tell you at the time, and cannot be combined unless we say so.</p>

<h2>16. Our intellectual property</h2>
<p>PostureLab, including its name, logo, design, software, text, graphics, and videos, is owned by us or our licensors and protected by copyright, trademark, and other laws. Nothing here transfers those rights to you beyond the limited licence in section 5. You may not use our name or logo without our written permission.</p>

<h2>17. Feedback</h2>
<p>If you send us ideas, suggestions, or feedback, we may use them freely, for any purpose, without any obligation or payment to you. You give up any rights in that feedback to the extent needed for us to use it, so we can build on ideas without restriction.</p>

<h2>18. Third-party services</h2>
<p>PostureLab relies on services from others, which may include Google sign-in and Firebase, and Core Academy on Skool, and may link to third-party sites. Your use of those services is governed by their own terms and privacy policies. We do not control them and are not responsible for them.</p>

<h2>19. App store terms</h2>
<p>If you install PostureLab from an app store, such as Apple's App Store or Google Play, that store's rules also apply. Where required, the store is not a party to these Terms, is not responsible for the app, and is not responsible for handling any claim you have about it. The store and its affiliates are third-party beneficiaries of these Terms and may enforce them against you.</p>

<h2>20. Suspension &amp; termination</h2>
<p>You may stop using PostureLab and close your account at any time.</p>
<p><b>We may, at our sole discretion, for any reason or no reason, with or without notice, disable, restrict, suspend, or terminate any account or any feature.</b> This includes cases where you break these Terms, where we are required to by law, or where we decide to change or wind down part of the service.</p>
<p>If we terminate a paying member's access without cause, we will refund the unused, prepaid portion of their membership. Sections that by their nature should continue after termination will do so, including sections 7, 8, 16, 17, 21, 22, 23, and 24.</p>

<h2>21. Disclaimer of warranties</h2>
<p>PostureLab is provided "as is" and "as available," without warranties of any kind, express or implied. To the fullest extent permitted by law, we disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the scores or measurements are accurate, that the service will be uninterrupted, secure, or error-free, or that any result you hope for will be achieved. Some places do not allow certain warranties to be excluded, so parts of this section may not apply to you.</p>

<h2>22. Limitation of liability</h2>
<p>To the fullest extent permitted by law, PostureLab and the people behind it will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill, or for any unauthorized access to, or loss, theft, or disclosure of, your data (see section 10), arising out of or related to your use of the service or any activity it suggests, even if told such damages are possible.</p>
<p>To the fullest extent permitted by law, our total liability for all claims relating to the service is limited to the greater of the amount you paid us in the twelve months before the event giving rise to the claim, or CAD 100. Nothing here limits liability that cannot be limited by law, such as for death or personal injury caused by our negligence where the law does not allow that to be excluded.</p>

<h2>23. Indemnification</h2>
<p>You agree to defend, indemnify, and hold harmless PostureLab and the people behind it from any claims, damages, losses, and reasonable costs, including legal fees, arising out of your Content, your use of the service, your breach of these Terms, or your violation of any law or another person's rights, to the extent permitted by law.</p>

<h2>24. Disputes &amp; governing law</h2>
<p>These Terms are governed by the laws of the Province of Ontario, Canada, without regard to its conflict-of-laws rules. If you have a dispute, contact us first and we will try to resolve it in good faith. Subject to any right you have under local law to use your local courts, disputes will be handled in the courts of Toronto, Ontario, Canada.</p>

<h2>25. Changes to these Terms</h2>
<p>We may update these Terms from time to time. If a change is significant, we will give reasonable notice, for example in the app or by email, and update the effective date above. If you keep using PostureLab after the change takes effect, you accept the updated Terms. If you do not agree to a change, stop using the service and close your account.</p>

<h2>26. Assignment</h2>
<p>You may not transfer your rights or obligations under these Terms without our consent. We may assign or transfer these Terms, in whole or in part, including to an affiliate or in connection with a merger, acquisition, financing, or sale of assets. These Terms bind and benefit each party's permitted successors.</p>

<h2>27. General</h2>
<p><b>Entire agreement.</b> These Terms and the documents they reference are the whole agreement between you and us about the service, replacing any earlier agreement on the same subject.</p>
<p><b>Severability.</b> If any part is found unenforceable, the rest stays in force, and the unenforceable part is limited only as much as needed.</p>
<p><b>No waiver.</b> If we do not enforce a part right away, we have not given up the right to enforce it later.</p>
<p><b>Force majeure.</b> We are not responsible for delays or failures caused by events beyond our reasonable control.</p>
<p><b>Electronic communication.</b> You agree we may communicate with you electronically, in the app or by email, and that this satisfies any legal requirement of writing.</p>

<h2>28. How to reach us</h2>
<p>Questions about these Terms, or requests about your account or data, go to <b>drdovefit@gmail.com</b>.</p>
`;

export const PRIVACY_HTML = `
<h1>PostureLab — Privacy Policy</h1>
<p class="meta"><b>Effective:</b> September 1, 2026 &nbsp;·&nbsp; <b>Provider:</b> PostureLab (Toronto, Ontario, Canada) &nbsp;·&nbsp; <b>Contact:</b> drdovefit@gmail.com</p>
<p>This Privacy Policy explains what information PostureLab collects, why, how it is stored, and the choices you have. It forms part of our Terms of Service. By using PostureLab, you agree to this policy.</p>

<h2>1. Who we are</h2>
<p>PostureLab is a posture-analysis and self-tracking app operated from Toronto, Ontario, Canada. For any privacy question or request, contact drdovefit@gmail.com.</p>

<h2>2. What we collect</h2>
<ul>
  <li><b>Account information</b> — your email address, and a display name if you add one. If you sign in with Google, we receive your basic Google account details (name, email, and profile photo).</li>
  <li><b>Your photos and scans</b> — the photos you take or upload, the posture measurements calculated from them, and the annotated result images.</li>
  <li><b>Your profile ("About you")</b> — the details you choose to enter, such as sex, birthday, height, weight, activity level, and any conditions or injuries you tick. You choose what to share, and you can leave any of it blank.</li>
  <li><b>Pain diary entries</b> — anything you log there.</li>
  <li><b>Basic technical information</b> — standard data needed to run the app and keep it secure, such as your device type and app version.</li>
  <li><b>Payment information</b> — if you buy a membership, our payment provider handles your card details. We do not store full card numbers.</li>
</ul>

<h2>3. Why we use it</h2>
<p>We use your information to run PostureLab for you: to calculate and show your posture results, to save and sync your data to your account across your devices, to provide support when you ask for it, to process memberships, to keep the service safe and working, and to meet our legal obligations. Our lawful basis, where required, is performing our agreement with you, your consent, and our legitimate interest in running and protecting the service.</p>

<h2>4. What we do not do</h2>
<p><b>We do not look at your scans or photos, and no other member can see them.</b> We do not sell your information. We do not use your photos for facial recognition or to identify you. We do not use your personal scans to train models or for advertising. If we ever want to use your Content for anything beyond running the service — such as a testimonial or promotion — we will ask for your separate, specific permission first.</p>

<h2>5. How your information is stored</h2>
<p>PostureLab is built local-first. Without an account, your scans and notes stay on your own device. When you sign in, your data is also saved to your private account so it can sync to your other devices, using Google Firebase / Google Cloud, over encrypted connections, in an area tied to your account so one account cannot read another's data. Because we operate from Canada and use global infrastructure, your information may be stored and processed in Canada, the United States, and other countries, which may have different privacy laws than your own.</p>

<h2>6. How long we keep it</h2>
<p>We keep your information for as long as your account is active. You can delete individual scans at any time, and deleting your account removes your stored scans, pain entries, and profile from your account. Copies may remain for a limited period in routine backups, and we keep the minimum records the law requires.</p>

<h2>7. Your rights and choices</h2>
<p>You can view and edit your profile in the app, delete individual scans, and delete your account. Depending on where you live, you may also have the right to access the personal information we hold about you, to correct it, to delete it, to receive a copy, to withdraw consent, or to object to certain uses. These rights come from laws such as PIPEDA in Canada, the GDPR in the European Union, the LGPD in Brazil, and state privacy laws in the United States. To make a request, email drdovefit@gmail.com, and we will respond as the law requires. You also have the right to complain to your local privacy regulator.</p>

<h2>8. Children</h2>
<p>PostureLab is not for children under 13, and we do not knowingly collect their information. Users between 13 and the age of majority need a parent's or guardian's permission, as set out in our Terms. A parent or guardian can contact us to review or delete a child's data.</p>

<h2>9. Security</h2>
<p>We take reasonable steps to protect your information, including encrypted connections and per-account access. No service can be completely secure, and we cannot guarantee absolute security. If a breach affects your information, we will act as the law requires, which may include notifying you. As set out in our Terms, and to the fullest extent permitted by law, we are not liable for a breach caused by hacking or a third party, though this does not remove any right you have under data-protection law that cannot be waived.</p>

<h2>10. Third parties</h2>
<p>We rely on trusted providers to run the app, including Google (sign-in and Firebase / Google Cloud hosting), our payment provider for memberships, and Core Academy on Skool for community and course content. These providers handle information only as needed to provide their service, under their own privacy policies. We do not sell your data to anyone.</p>

<h2>11. Local storage on your device</h2>
<p>PostureLab stores data on your device to work offline and to remember your settings and preferences. This is used to run the app for you, not to track you across other websites, and clearing your browser or app data will remove it.</p>

<h2>12. Changes to this policy</h2>
<p>We may update this Privacy Policy. If a change is significant, we will give reasonable notice and ask you to agree before you continue using PostureLab, and we will update the effective date above.</p>

<h2>13. Contact us</h2>
<p>For any privacy question or request, contact <b>drdovefit@gmail.com</b>.</p>
`;
