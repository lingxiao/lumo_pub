/**
 *
 *
 * @Package: AppAcidPage
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import AppImageView from './../components/AppImageView'
import { CenterHorizontalView } from './../components/UtilViews'

import {
	urlToFileExtension,
} from './../model/core'

const {
	useBurnStyles,	
} = require('./AppBurnPageComponents')

const burn2 = require("./../assets/burn2.jpeg")
const cube = require("./../assets/2.jpg")
const cubes = require("./../assets/2-small.jpg")


/******************************************************
	@constants + view components
******************************************************/



// featurebox text
// So if you voted 50 times and lost each one, you will still earn 1 tab!`}
const datasource = [
	{idx:-1, key: "", value: ""},
	{idx:-2, key: "", value: ""},
	{idx:-3, key: "", value: ""},
    {idx: 0, key: `SOCIAL MEDIA`  , value: `As part of the functionality of the Site, you may link your account with online accounts you have with third-party service providers (each such account, a “Third-Party Account”) by either: (1) providing your Third-Party Account login information through the Site; or (2) allowing us to access your Third-Party Account, as is permitted under the applicable terms and conditions that govern your use of each Third-Party Account. You represent and warrant that you are entitled to disclose your Third-Party Account login information to us and/or grant us access to your Third-Party Account, without breach by you of any of the terms and conditions that govern your use of the applicable Third-Party Account, and without obligating us to pay any fees or making us subject to any usage limitations imposed by the third-party service provider of the Third-Party Account. By granting us access to any Third-Party Accounts, you understand that (1) we may access, make available, and store (if applicable) any content that you have provided to and stored in your Third-Party Account (the “Social Network Content”) so that it is available on and through the Site via your account, including without limitation any friend lists and (2) we may submit to and receive from your Third-Party Account additional information to the extent you are notified when you link your account with the Third-Party Account. Depending on the Third-Party Accounts you choose and subject to the privacy settings that you have set in such Third-Party Accounts, personally identifiable information that you post to your Third-Party Accounts may be available on and through your account on the Site. Please note that if a Third-Party Account or associated service becomes unavailable or our access to such Third-Party Account is terminated by the third-party service provider, then Social Network Content may no longer be available on and through the Site. You will have the ability to disable the connection between your account on the Site and your Third-Party Accounts at any time. PLEASE NOTE THAT YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS. We make no effort to review any Social Network Content for any purpose, including but not limited to, for accuracy, legality, or non-infringement, and we are not responsible for any Social Network Content. You acknowledge and agree that we may access your email address book associated with a Third-Party Account and your contacts list stored on your mobile device or tablet computer solely for purposes of identifying and informing you of those contacts who have also registered to use the Site. You can deactivate the connection between the Site and your Third-Party Account by contacting us using the contact information below or through your account settings (if applicable). We will attempt to delete any information stored on our servers that was obtained through such Third-Party Account, except the username and profile picture that become associated with your account.`},
    {idx: 1, key: `SUBMISSIONS`   , value: `You acknowledge and agree that any questions, comments, suggestions, ideas, feedback, or other information regarding the Site or the Marketplace Offerings ("Submissions") provided by you to us are non-confidential and shall become our sole property. We shall own exclusive rights, including all intellectual property rights, and shall be entitled to the unrestricted use and dissemination of these Submissions for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you. You hereby waive all moral rights to any such Submissions, and you hereby warrant that any such Submissions are original with you or that you have the right to submit such Submissions. You agree there shall be no recourse against us for any alleged or actual infringement or misappropriation of any proprietary right in your Submissions. `},
    {idx: 2, key: `SITE MANAGEMENT`, value: `We reserve the right, but not the obligation, to: (1) monitor the Site for violations of these Terms of Use; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Use, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Site or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site and the Marketplace Offerings.`},
    {idx: 3, key: `COPYRIGHT INFRINGEMENTS`, value: `We respect the intellectual property rights of others. If you believe that any material available on or through the Site infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a “Notification”). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to applicable law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Site infringes your copyright, you should consider first contacting an attorney.`},
    {idx: 4, key: `TERM AND TERMINATION`, value: `
These Terms of Use shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF USE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE AND THE MARKETPLACE OFFERINGS (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OF USE OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SITE AND THE MARKETPLACE OFFERINGS OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION. 

If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.`},
    {idx: 5, key: `MODIFICATIONS AND INTERRUPTIONS`, value: `We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Marketplace Offerings without notice at any time. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site or the Marketplace Offerings.  We cannot guarantee the Site and the Marketplace Offerings will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Site, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Site or the Marketplace Offerings at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Site or the Marketplace Offerings during any downtime or discontinuance of the Site or the Marketplace Offerings. Nothing in these Terms of Use will be construed to obligate us to maintain and support the Site or the Marketplace Offerings or to supply any corrections, updates, or releases in connection therewith.`},
    {idx: 6, key: `GOVERNING LAW`, value: `These terms shall be governed by and defined following the laws of Delware. Lumos,LLC and yourself irrevocably consent that the courts of Delware shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms`},
    {idx: 7, key: `CORRECTIONS`, value: `There may be information on the Site that contains typographical errors, inaccuracies, or omissions that may relate to the Marketplace Offerings, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Site at any time, without prior notice.`},
    {idx: 8, key: `DISPUTE RESOLUTION`, value: `Any legal action of whatever nature brought by either you or us (collectively, the “Parties” and individually, a “Party”) shall be commenced or prosecuted in the state and federal courts located in San Francisco, California, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction and forum non conveniens with respect to venue and jurisdiction in such state and federal courts. Application of the United Nations Convention on Contracts for the International Sale of Goods and the Uniform Computer Information Transaction Act (UCITA) are excluded from these Terms of Use.`},
    {idx: 9, key: `disclaimer`, value: `THE SITE AND THE MARKETPLACE OFFERINGS ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND THE MARKETPLACE OFFERINGS AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SITE’S CONTENT OR THE CONTENT OF ANY WEBSITES LINKED TO THE SITE AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SITE, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SITE OR THE MARKETPLACE OFFERINGS, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SITE BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SITE. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SITE, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.`},
    {idx: 10, key: `LIMITATIONS OF LIABILITY`, value: `IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE OR THE MARKETPLACE OFFERINGS, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`},
	{idx: 11, key: "INDEMNIFICATION", value:"You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys’ fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Marketplace Offerings; (3) breach of these Terms of Use; (4) any breach of your representations and warranties set forth in these Terms of Use; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Site or the Marketplace Offerings with whom you connected via the Site. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it."},
	{idx: 12, key: "USER DATA", value:"We will maintain certain data that you transmit to the Site for the purpose of managing the performance of the Marketplace Offerings, as well as data relating to your use of the Marketplace Offerings. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Marketplace Offerings. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data."},
	{idx: 13, key: "ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES", value:"Visiting the Site, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SITE. You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means. "},
	{idx: 14, key: "CALIFORNIA USERS AND RESIDENTS", value:"If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254."},
	{idx: 15, key: "MISCELLANEOUS", value:"These Terms of Use and any policies or operating rules posted by us on the Site or in respect to the Marketplace Offerings constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms of Use shall not operate as a waiver of such right or provision. These Terms of Use operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Terms of Use is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Terms of Use and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Terms of Use or use of the Marketplace Offerings. You agree that these Terms of Use will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Terms of Use and the lack of signing by the parties hereto to execute these Terms of Use."},
	{idx: 16, key: "CONTACT US", value:"In order to resolve a complaint regarding the Site or the Marketplace Offerings or to receive further information regarding use of the Site or the Marketplace Offerings, please contact us at: contact@lumo.land"},
	// {idx: 15, key: "", value:""},
	// {idx: 15, key: "", value:""},
]

const link_style = {
	cursor:'pointer',
	textDecoration:'underline', 
	fontFamily: "NeueMachina-Black"
}


/******************************************************
	@Acid tab page
******************************************************/


/**
 *
 * @Use: page for explaining burn page
 *
**/
export default function AppBurnTOS(props){

	/******************************************************/
	// mount + responders

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const { navigate } = props;


	function onGotoBurnTab(){
       	navigate("/firehose")
	}

	function onInstall(){
		return;
	}

	/******************************************************/
	// views

	const text_style = { color: COLORS.text }

	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}


	return (
		<div style={bg_style}>
			<div>
	        <Helmet>
	            <title>{"Terms"}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay
				darken       
				no_video_bg
				image_url={burn2}
				preview_url={burn2}
				containerStyle={{background:COLORS.red_2}}
				on_image_did_load={on_fullscreen_image_did_load}
			/>							

			<Stack direction='row' style={{width:'100vw'}}>
				<div 
					className={bstyle.scroll_container} 
					style={{
						height:'100vh', 
				        overflowX:'hidden',
						width: isOnMobile ? '100vw' : '50vw',
				}}>
					{ datasource.map((data, idx) => {
							if ( data.idx === -1 ){
								return (
									<Stack 
										key={idx}
										direction='row' 
										className={bstyle.footer} 
										style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
									>
										{'A communal ☺ space'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to share ☺ the burn'.toUpperCase()}
									</Stack>
								)
							} else if ( data.idx === -2) {
								return (
									<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='row'>
										{'TERMS AND CONDITIONS'.toUpperCase()}
									</Stack>
								)
							} else if ( data.idx === -3) {
								return (
									<Stack key={idx} className={bstyle.tos} direction='column' style={{...text_style, marginTop:'24px'}}>
										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'AGREEMENT TO TERMS'}
										</div>
										<p>
											{`These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Lumos,LLC ("Company", “we”, “us”, or “our”), concerning your access to and use of the lumo.land website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”). We are registered in Ohio, United States . The Site provides an online marketplace for the following goods, products, and/or services: High production value digital media (the “Marketplace Offerings”). In order to help make the Site a secure environment for the purchase and sale of Marketplace Offerings, all users are required to accept and comply with these Terms of Use. You agree that by accessing the Site and/or the Marketplace Offerings, you have read, understood, and agree to be bound by all of these Terms of Use. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF USE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND/OR THE MARKETPLACE OFFERINGS AND YOU MUST DISCONTINUE USE IMMEDIATELY.`}
										</p>
										<p>
											{'Supplemental terms and conditions or documents that may be posted on the Site from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Use at any time and for any reason. We will alert you about any changes by updating the “Last updated” date of these Terms of Use, and you waive any right to receive specific notice of each such change. Please ensure that you check the applicable Terms every time you use our Site so that you understand which Terms apply. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Terms of Use by your continued use of the Site after the date such revised Terms of Use are posted.'}
										</p>
										<p>
											{'The information provided on the Site is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Site from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.'}
										</p>
											{`The Site is not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use this Site. You may not use the Site in a way that would violate the Gramm-Leach-Bliley Act (GLBA). The Site is intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Site or use the Marketplace Offerings.`}
										<p>
										</p>


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'INTELLECTUAL PROPERTY RIGHTS'}
										</div>
										<p>
											{`Unless otherwise indicated, the Site and the Marketplace Offerings are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the United States, international copyright laws, and international conventions. The Content and the Marks are provided on the Site “AS IS” for your information and personal use only. Except as expressly provided in these Terms of Use, no part of the Site or the Marketplace Offerings and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission. Provided that you are eligible to use the Site, you are granted a limited license to access and use the Site and to download or print a copy of any portion of the Content to which you have properly gained access solely for your personal, non-commercial use. We reserve all rights not expressly granted to you in and to the Site, the Content and the Marks.`}
										</p>


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'USER REPRESENTATIONS'}
										</div>
										<p>
											{`By using the Site or the Marketplace Offerings, you represent and warrant that:(1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Use; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Site or the Marketplace Offerings through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Site for any illegal or unauthorized purpose; and (7) your use of the Site or the Marketplace Offerings will not violate any applicable law or regulation.`}
										</p>
										<p>
											{`If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Site (or any portion thereof).`}
										</p>
										<p>
											{`You may not use the Site or the Marketplace Offerings for any illegal or unauthorized purpose nor may you, in the use of Marketplace Offerings, violate any laws. Among unauthorized Marketplace Offerings are the following: intoxicants of any sort; illegal drugs or other illegal products; alcoholic beverages; games of chance; and pornography or graphic adult content, images, or other adult products. Postings of any unauthorized products or content may result in immediate termination of your account and a lifetime ban from use of the Site.`}
										</p>
										<p>
											{`We are a service provider and make no representations as to the safety, effectiveness, adequacy, accuracy, availability, prices, ratings, reviews, or legality of any of the information contained on the Site or the Marketplace Offerings displayed or offered through the Site. You understand and agree that the content of the Site does not contain or constitute representations to be reasonably relied upon, and you agree to hold us harmless from any errors, omissions, or misrepresentations contained within the Site’s content. We do not endorse or recommend any Marketplace Offerings and the Site is provided for informational and advertising purposes only.`}
										</p>


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'USER REGISTRATION'}
										</div>
										<p>
											{`You may be required to register with the Site in order to access the Marketplace Offerings. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.`}
										</p>


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'MARKETPLACE OFFERINGS'}
										</div>
										<p>
											{`All Marketplace Offerings are subject to availability, and we cannot guarantee that Marketplace Offerings will be in stock. Certain Marketplace Offerings may be available exclusively online through the Site. Such Marketplace Offerings may have limited quantities and are subject to return or exchange only according to our Return Policy.
											We reserve the right to limit the quantities of the Marketplace Offerings offered or available on the Site. All descriptions or pricing of the Marketplace Offerings are subject to change at any time without notice, at our sole discretion. We reserve the right to discontinue any Marketplace Offerings at any time for any reason. We do not warrant that the quality of any of the Marketplace Offerings purchased by you will meet your expectations or that any errors in the Site will be corrected.`}
										</p>


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{'PURCHASES AND PAYMENT'}
										</div>
										<p>
											{`
												We accept the following forms of payment: `}
										</p>
										<p>
											{`
												You agree to provide current, complete, and accurate purchase and account information for all purchases of the Marketplace Offerings made via the Site. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in U.S. dollars.  

												You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.

												We reserve the right to refuse any order placed through the Site. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.


											`}
										</p>		


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{`REFUNDS POLICY`}
										</div>
										<p>
											{`All sales are final and no refund will be issued.`}
										</p>																	


										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{`PROHIBITED ACTIVITIES`}
										</div>
										<p>
											{`

												You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. 

												As a user of the Site, you agree not to:

												1. Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.
												2. Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.
												3. Circumvent, disable, or otherwise interfere with security-related features of the Site, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Site and/or the Content contained therein.
												4. Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site.
												5. Use any information obtained from the Site in order to harass, abuse, or harm another person.
												6. Make improper use of our support services or submit false reports of abuse or misconduct.
												7. Use the Site in a manner inconsistent with any applicable laws or regulations.
												8. Engage in unauthorized framing of or linking to the Site.
												9. Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party’s uninterrupted use and enjoyment of the Site or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Marketplace Offerings.
												10. Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.
												11. Delete the copyright or other proprietary rights notice from any Content.
												12. Attempt to impersonate another user or person or use the username of another user.
												13. Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats (“gifs”), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as “spyware” or “passive collection mechanisms” or “pcms”).
												14. Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.
												15. Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Marketplace Offerings to you.
												16. Attempt to bypass any measures of the Site designed to prevent or restrict access to the Site, or any portion of the Site.
												17. Copy or adapt the Site’s software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.
												18. Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Site.
												19. Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Site, or using or launching any unauthorized script or other software.
												20. Use a buying agent or purchasing agent to make purchases on the Site.
												21. Make any unauthorized use of the Marketplace Offerings, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.
												22. Use the Marketplace Offerings as part of any effort to compete with us or otherwise use the Site and/or the Content for any revenue-generating endeavor or commercial enterprise.												

											`}
										</p>

										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{`USER GENERATED CONTRIBUTIONS`}
										</div>
										<p>
											{`

												The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions"). Contributions may be viewable by other users of the Site and the Marketplace Offerings and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary. When you create or make available any Contributions, you thereby represent and warrant that:

												1.  The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.
												2.  You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Site, and other users of the Site to use your Contributions in any manner contemplated by the Site and these Terms of Use.
												3.  You have the written consent, release, and/or permission of each and every identifiable individual person in your Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of your Contributions in any manner contemplated by the Site and these Terms of Use.
												4.  Your Contributions are not false, inaccurate, or misleading.
												5.  Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.
												6.  Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).
												7.  Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.
												8.  Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote violence against a specific person or class of people.
												9.  Your Contributions do not violate any applicable law, regulation, or rule.
												10.  Your Contributions do not violate the privacy or publicity rights of any third party.
												11.  Your Contributions do not violate any applicable law concerning child pornography, or otherwise intended to protect the health or well-being of minors.
												12.  Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.
												13.  Your Contributions do not otherwise violate, or link to material that violates, any provision of these Terms of Use, or any applicable law or regulation.

												Any use of the Site or the Marketplace Offerings in violation of the foregoing violates these Terms of Use and may result in, among other things, termination or suspension of your rights to use the Site and the Marketplace Offerings.


											`}
										</p>



										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{`CONTRIBUTION LICENSE`}
										</div>
										<p>
											{`

												By posting your Contributions to any part of the Site or making Contributions accessible to the Site by linking your account from the Site to any of your social networking accounts, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions (including, without limitation, your image and voice) for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of, or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing. The use and distribution may occur in any media formats and through any media channels. 

												This license will apply to any form, media, or technology now known or hereafter developed, and includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial images you provide. You waive all moral rights in your Contributions, and you warrant that moral rights have not otherwise been asserted in your Contributions. 

												We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Site. You are solely responsible for your Contributions to the Site and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions. 

												We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise change any Contributions; (2) to re-categorize any Contributions to place them in more appropriate locations on the Site; and (3) to pre-screen or delete any Contributions at any time and for any reason, without notice. We have no obligation to monitor your Contributions.
																								

											`}
										</p>										

									</Stack>
								)
							} else {
								return (
									<Stack key={idx} className={bstyle.tos} direction='column' style={{...text_style, marginTop:'24px'}}>
										<div className={bstyle.body} style={{...text_style, marginLeft:'-0px'}} >
											{(data.key ?? "").toUpperCase()}
										</div>
										<p>
											{data.value}
										</p>
									</Stack>
								)
							}
						})
					}
				</div>					
				{ isOnMobile 
					? 
					<div/> 
					:
					<Stack direction='column' style={{width:'50vw', background:COLORS.black,height:'100vh'}}>
						<CenterHorizontalView>
				            <Box sx={{ flexGrow: 1 }} />
				            <AppImageView   
				                width = {"100vw"}
				                height= {"100vw"}
				                imageDidLoad = {() => {}}
				                preview_url  = {cubes}
				                imgSrc       = {cube}
				                type         = {urlToFileExtension(cube)}
				                imgStyle ={{}}
				            />    							
						</CenterHorizontalView>	            
			            <Box sx={{ flexGrow: 1 }} />
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}
































