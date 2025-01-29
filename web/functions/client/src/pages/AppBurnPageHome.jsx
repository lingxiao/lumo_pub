/**
 *
 *
 * @Package: AppBurnPage
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState} from 'react'
import {Helmet} from "react-helmet";

import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {
	cap,
	trivialProps,
	trivialString,
} from './../model/utils'

import AuthAndCard, {AuthAbout} from './AuthAndCard';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import withSnack from './../hoc/withSnack';

const burn2 = require("./../assets/burn2.jpeg")

const {
	useBurnStyles,
	BurnHeader,
	ManifestoAlt,
	BurnDetail,
	BurnBanner,
	BurnFooter,
	UserProfileHeader,
} = require('./AppBurnPageComponents')


/******************************************************
	@View exported
******************************************************/

const link_style = {
	cursor:'pointer',
	color: COLORS.text2,
	textDecoration:'underline', 
	fontFamily: "NeueMachina-Black",
}

/**
 * @Use: page for explaining burn page
 *
**/
function AppBurnPageHome(props){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const {
		tellUser,
		user_cache,
		chain_service,
		navigate,
	} = props;

	/******************************************************/
	// handlers

	let dabout = "Your burning manifesto"
	const [ view_st, eview_st ]     = useState(0);
	const [ bname, ebname ]         = useState("");
	const [ about, eabout ]         = useState(dabout);
	const [ btn_label, ebtn_label ] = useState("Step 1. Drop a Manifesto");
	const [ showProgress, eshowProgress ] = useState(false);


	async function onClickInitiate(){
		if ( user_cache.isAuthed() ){
			eview_st(2)
		} else {
			eview_st(1);
		}
	}

	async function onDidAuth(){
		eview_st(2);
	}

	// @Use: create new chain, redirect to chain;
	async function onDidEditAbout(){

		if ( trivialString(bname) ){
			return tellUser("Please name your manifesto")

		} else if (trivialString(about) || about.toLowerCase() === dabout.toLowerCase() ) {

			return tellUser("Please write a manifesto")

		} else {

			eshowProgress(true);
			ebtn_label("dropping manifesto");
			tellUser("This will take a moment");
			await chain_service.create_chain({
				name: bname,
				about: about,
				then: async ({ success, data, message }) => {
					let chain_id = trivialProps(data,'chain_id') ? "" : data.chain_id;
					if ( !success || trivialString(chain_id) ){
						tellUser(message);
						ebtn_label("Please try again");
						eshowProgress(false);
					} else {
						tellUser("One more second while we redirect you to your first burn");
				        let { subdomain } = data;
				        let _url = trivialString(subdomain) ? chain_id : subdomain;
				        setTimeout(() => {
							eview_st(0);
							eshowProgress(false);
							ebtn_label("Burn");
					        navigate(`/burn/${_url}`)
				        },300)
					}
				}
			})
		}
	}

	function onClickLumo(){
        navigate('/firehose')
	}	

	function onInstallApp(){
        navigate('/thelittleredapp')
	}

	/******************************************************/
	// views

	function str1(){
		return (
			<p>	
{/*				{`* `}
				<span style={{textDecoration:'underline'}}>{`Initiate`}</span>
				{` new members into your movement with a manifesto staking your immutable communal values.`}
*/}				{"* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris"}
			</p>
		)
	}

	function str2(){
		return (
			<p>				
{/*				{`* Hold weekly burn events to initiate new members. Use `}
				<span style={{textDecoration:'underline', cursor:'pointer'}} onClick={onClickLumo}>
					{`burn tabs`}
				</span>
				{` to `}
				<span style={{textDecoration:'underline', cursor:'pointer'}} onClick={onInstallApp}>
				{`elect`}
				</span>
				{` community champions.`}				
*/}
			{"* Praesent laoreet sem vel nisi finibus cursus. Donec imperdiet quis ex aliquet mattis. "}
			</p>
		)
	}	

	function str3(){
		return (
			<p>				
{/*				{`* Loyal members will `}
				<span style={{textDecoration:'underline', cursor:'pointer'}} onClick={onClickLumo}>
					{`earn tabs`}
				</span>
				{` for contributing to the movement. Endowed members can purchase tabs from you to fuel future burns.`}
*/}			
			{"* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris"}
			</p>
		)
	}	

	function faq(){
		// return (
		// 	<p>
		// 		{`Many communities are started without a clear mission and values. Writing a manifesto is a great way to clarify the whys of a community.`}
		// 		<br/><br/>
		// 		{`Once a manifesto is written, share the link to collect signatures from the community. Activists are rewarded with `}
		// 		<span style={link_style} onClick={onClickLumo}>
		// 			{`burn tabs`}
		// 		</span>			
		// 		{` each time they sign the manifesto. If a manifesto is the kindle that lights the fire, then the burn tab is the fuel that keeps the fire going. Each time activists sign the manifesto or `}
		// 		<span style={link_style} onClick={onInstallApp}>
		// 			{`gift the tabs`}
		// 		</span>
		// 		{` to each other, the burn timer is extended.`}	
		// 		<br/><br/>
		// 		{`In short, the burn event is an initiation ritual to turn your mission into a community, and your community into a movement.`}

		// 	</p>
		// )
		return (
			<p>
				{"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris, ac volutpat tortor lacus sed velit. Integer consequat volutpat leo quis congue."}
				<br/><br/>
				{"Praesent laoreet sem vel nisi finibus cursus. Donec imperdiet quis ex aliquet mattis. Mauris tincidunt, metus eget iaculis molestie, mi metus semper lacus, vitae pharetra massa ante non quam. Curabitur at hendrerit nisi. Maecenas tincidunt porta nulla non pretium. Proin metus nunc, lacinia ac nunc sed, rutrum tincidunt nibh. Pellentesque bibendum imperdiet diam quis malesuada. Mauris aliquam libero turpis, at viverra risus ultrices in."}
			</p>


		)
	}


	// change bacgrkound color
	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	// function on_fullscreen_image_did_load(){
		// ebg_style({})
	// }

	return (
		<div style={bg_style}>
	        <Helmet>
	            <title>{"LUMO"}</title>
	        </Helmet>
	        {/*
			<GiphBackgroundView 
				no_delay
				darken       
				no_video_bg
				image_url={burn2}
				preview_url={burn2}
				containerStyle={{background:COLORS.red_2}}
				on_image_did_load={on_fullscreen_image_did_load}
			/>		
	        */}
			<div className={bstyle.scroll_container} style={{height:'100vh', overflowX:'hidden'}}>
				{ [-2,-1,0,1,2,3,4].map((data, idx) => {
					if ( data === -2 ){
						return (
							<UserProfileHeader {...props} style={{marginRight: isOnMobile ? '0px' : '18px'}}/>
						)
					} else if ( data === -1 ){
						return (
							<BurnHeader
								{...props}
								text={'Lumo burn events'.toUpperCase()}
								style={{paddingTop:'50px'}}
							/>							
						)
					} else if ( data === 0 ){
						if ( view_st === 0 ){
							return (
								<ManifestoAlt
									{...props}
									key={idx}
									image_left
									title={"** what is a burn".toUpperCase()}
									faq={faq}
									state = {view_st}
									btn_str={"Initiate the burn".toUpperCase()}
									onClickInitiate={onClickInitiate}
									onDidEditAbout={onDidEditAbout}
									style={{width:isOnMobile ? '90vw' : '60vw'}}
									tellUser={tellUser}
								/>
							)
						} else if (view_st === 1 ){
							return (
								<AuthAndCard
									{...props}
									promptA={""}
									promptB={""}
									tellUser={tellUser}
									style={{}}
									onWillAuth={cap}
									onDidAuth={onDidAuth}
									onWillSaveCard={cap}
									onDidSaveCard = {cap}
								/>
							)
						} else {
							return (
								<AuthAbout
									{...props}
									about={about}
									eabout={eabout}
									bname={bname}
									ebname={ebname}
									btn_label = {btn_label}
									onDidEditAbout={onDidEditAbout}
									tellUser={tellUser}
									showProgress={showProgress}
								/>
							)
						}
					} else if ( data === 1) {
						return ( 
							<BurnBanner
								key={idx}
								style={{marginTop:'48px'}}
								text="** 250 people have burned"
							/> 
						)										
					} else if (data === 2){
						return (
							<BurnDetail 
								key={idx}
								style={{marginTop:'24px'}}
								header={`what is burn to earn`.toUpperCase()}
								str1={str1}
								str2={str2}
								str3={str3}

							/>
						)					
					} else if ( data === 3) {
						return ( 
							<BurnBanner
								key={idx}
								style={{marginTop:'24px'}}
								text="** 250 people have earned"
							/> 
						)				
					} else if ( data === 4 ){
						return (
							<BurnFooter {...props} key={idx}/>
						)
					} else {
						return ( <div/> )
					}
				})
				}
			</div>
        </div>
    )
}





export default withSnack(withAuth(withRouter(AppBurnPageHome)));

