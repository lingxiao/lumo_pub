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
const cube = require("./../assets/3.jpg")
const cubes = require("./../assets/3.jpg")


/******************************************************
	@constants + view components
******************************************************/



// featurebox text
// So if you voted 50 times and lost each one, you will still earn 1 tab!`}
const datasource = [
	{idx:-1, key: "", value: ""},
	{idx:-2, key: "", value: ""},
    {idx: 0, key: ``  , value: `This privacy notice for Lumos,Inc ("Company," "we," "us," or "our"), describes how and why we might collect, store, use, and/or share ("process") your information when you use our services ("Services"), such as when you:
        Download and use our mobile application (LumoBurnApp), or any other application of ours that links to this privacy notice
        Engage with us in other related ways, including any sales, marketing, or events
        Questions or concerns? Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at contact@lumo.land.`},

	{idx: 1, key: `SUMMARY OF KEY POINTS`, value:`This summary provides key points from our privacy notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for. You can also click here to go directly to our table of contents.

        What personal information do we process? When you visit, use, or navigate our Services, we may process personal information depending on how you interact with Lumos,Inc and the Services, the choices you make, and the products and features you use. Click here to learn more.

        Do we process any sensitive personal information? We do not process sensitive personal information.

        Do we receive any information from third parties? We do not receive any information from third parties.

        How do we process your information? We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Click here to learn more.

        In what situations and with which parties do we share personal information? We may share information in specific situations and with specific third parties. Click here to learn more.

        How do we keep your information safe? We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Click here to learn more.

        What are your rights? Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Click here to learn more.

        How do you exercise your rights? The easiest way to exercise your rights is by filling out our data subject request form available here, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.

        Want to learn more about what Lumos,Inc does with any information we collect? Click here to review the notice in full.
        `},
    	{idx: 1, key: "1. WHAT INFORMATION DO WE COLLECT?", value: `In Short: We collect personal information that you provide to us.

        We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.

        Personal Information Provided by You. The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
        usernames
        Sensitive Information. We do not process sensitive information.

        Social Media Login Data. We may provide you with the option to register with us using your existing social media account details, like your Facebook, Twitter, or other social media account. If you choose to register in this way, we will collect the information described in the section called "HOW DO WE HANDLE YOUR SOCIAL LOGINS?" below.

        All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.`},

        {key: "2. HOW DO WE PROCESS YOUR INFORMATION?", value: `
            In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
            We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
            To facilitate account creation and authentication and otherwise manage user accounts. We may process your information so you can create and log in to your account, as well as keep your account in working order.
            To save or protect an individual's vital interest. We may process your information when necessary to save or protect an individual’s vital interest, such as to prevent harm.        
        `},
        {key: "3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?", value: `
            In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
            If you are located in the EU or UK, this section applies to you.
            The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
            Consent. We may process your information if you have given us permission (i.e., consent) to use your personal information for a specific purpose. You can withdraw your consent at any time. Click here to learn more.
            Legal Obligations. We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.
            Vital Interests. We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.
            If you are located in Canada, this section applies to you.
            We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time. Click here to learn more.
            In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:
            If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way
            For investigations and fraud detection and prevention
            For business transactions provided certain conditions are met
            If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim
            For identifying injured, ill, or deceased persons and communicating with next of kin
            If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse
            If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province
            If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records
            If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced
            If the collection is solely for journalistic, artistic, or literary purposes
            If the information is publicly available and is specified by the regulations
        `},
        {key: "4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?", value: `
            In Short: We may share information in specific situations described in this section and/or with the following third parties.
            We may need to share your personal information in the following situations:
            Business Transfers. We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
        `},
        {key: "5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?", value: `
            In Short: If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.
            Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or Twitter logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.
            We will use the information we receive only for the purposes that are described in this privacy notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.
        `},
        {key: "6. HOW LONG DO WE KEEP YOUR INFORMATION?", value: `
            In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
            We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.        
        `},
        {key: "7. HOW DO WE KEEP YOUR INFORMATION SAFE?", value: `
            In Short: We aim to protect your personal information through a system of organizational and technical security measures.
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
        `},
        {key: "8. WHAT ARE YOUR PRIVACY RIGHTS?", value: `
            In Short: In some regions, such as the European Economic Area (EEA), United Kingdom (UK), and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
            In some regions (like the EEA, UK, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
            We will consider and act upon any request in accordance with applicable data protection laws. 
            If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your local data protection supervisory authority. You can find their contact details here: https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm.
            If you are located in Switzerland, the contact details for the data protection authorities are available here: https://www.edoeb.admin.ch/edoeb/en/home.html.
            Withdrawing your consent: If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below or updating your preferences.
            However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
        `},
        {key: "Account Information", value: `
            If you would at any time like to review or change the information in your account or terminate your account, you can:
            Contact us using the contact information provided.
            Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
            If you have questions or comments about your privacy rights, you may email us at contact@lumo.land.        
        `},
        {key: "9. CONTROLS FOR DO-NOT-TRACK FEATURES", value: `
            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this privacy notice.
        `},
        {key: "10. DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?", value: `
            In Short: Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.
            California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.
            If you are under 18 years of age, reside in California, and have a registered account with Services, you have the right to request removal of unwanted data that you publicly post on the Services. To request removal of such data, please contact us using the contact information provided below and include the email address associated with your account and a statement that you reside in California. We will make sure the data is not publicly displayed on the Services, but please be aware that the data may not be completely or comprehensively removed from all our systems (e.g., backups, etc.).        
        `},
        {key: "CCPA Privacy Notice", value: `
            The California Code of Regulations defines a "resident" as:
            (1) every individual who is in the State of California for other than a temporary or transitory purpose and
            (2) every individual who is domiciled in the State of California who is outside the State of California for a temporary or transitory purpose
            All other individuals are defined as "non-residents."
            If this definition of "resident" applies to you, we must adhere to certain rights and obligations regarding your personal information.
            We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:
            Receiving help through our customer support channels;
            Participation in customer surveys or contests; and
            Facilitation in the delivery of our Services and to respond to your inquiries.            
        `},
        {key: "How do we use and share your personal information?", value: `
            More information about our data collection and sharing practices can be found in this privacy notice.
            You may contact us by email at contact@lumo.land, or by referring to the contact details at the bottom of this document.
            If you are using an authorized agent to exercise your right to opt out we may deny a request if the authorized agent does not submit proof that they have been validly authorized to act on your behalf.
        `},
        {key: "Will your information be shared with anyone else?", value: `
            We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Each service provider is a for-profit entity that processes the information on our behalf.
            We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be "selling" of your personal information.
            Lumos,Inc has not disclosed or sold any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. Lumos,Inc will not sell personal information in the future belonging to website visitors, users, and other consumers.
        `},
        {key: "Your rights with respect to your personal data", value: `
            Right to request deletion of the data — Request to delete
            You can ask for the deletion of your personal information. If you ask us to delete your personal information, we will respect your request and delete your personal information, subject to certain exceptions provided by law, such as (but not limited to) the exercise by another consumer of his or her right to free speech, our compliance requirements resulting from a legal obligation, or any processing that may be required to protect against illegal activities.
            Right to be informed — Request to know
            Depending on the circumstances, you have a right to know:
            whether we collect and use your personal information;
            the categories of personal information that we collect;
            the purposes for which the collected personal information is used;
            whether we sell your personal information to third parties;
            the categories of personal information that we sold or disclosed for a business purpose;
            the categories of third parties to whom the personal information was sold or disclosed for a business purpose; and
            the business or commercial purpose for collecting or selling personal information.
            In accordance with applicable law, we are not obligated to provide or delete consumer information that is de-identified in response to a consumer request or to re-identify individual data to verify a consumer request.
            Right to Non-Discrimination for the Exercise of a Consumer’s Privacy Rights
            We will not discriminate against you if you exercise your privacy rights.
            Verification process
            Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. These verification efforts require us to ask you to provide information so that we can match it with information you have previously provided us. For instance, depending on the type of request you submit, we may ask you to provide certain information so that we can match the information you provide with the information we already have on file, or we may contact you through a communication method (e.g., phone or email) that you have previously provided to us. We may also use other verification methods as the circumstances dictate.
            We will only use personal information provided in your request to verify your identity or authority to make the request. To the extent possible, we will avoid requesting additional information from you for the purposes of verification. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes. We will delete such additionally provided information as soon as we finish verifying you.
            Other privacy rights
            You may object to the processing of your personal information.
            You may request correction of your personal data if it is incorrect or no longer relevant, or ask to restrict the processing of the information.
            You can designate an authorized agent to make a request under the CCPA on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with the CCPA.
            You may request to opt out from future selling of your personal information to third parties. Upon receiving an opt-out request, we will act upon the request as soon as feasibly possible, but no later than fifteen (15) days from the date of the request submission.            To exercise these rights, you can contact us by email at contact@lumo.land, or by referring to the contact details at the bottom of this document. If you have a complaint about how we handle your data, we would like to hear from you.

        `},
        {key: "11. DO WE MAKE UPDATES TO THIS NOTICE?", value: `
            In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.
            We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.

        `},
        {key: "12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?", value: `If you have questions or comments about this notice, you may email us at contact@lumo.land `},
        {key: "13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?", value: `
            You have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please submit a request form by contacting contact@lumo.land       
        `},


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
export default function AppBurnPrivacy(props){

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
										{'A safe ☺ space'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to receive ☺ the burn'.toUpperCase()}
									</Stack>
								)
							} else if ( data.idx === -2) {
								return (
									<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='row'>
										{'PRIVACY NOTICE'.toUpperCase()}
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
































