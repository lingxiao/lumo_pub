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
import withSnack from './../hoc/withSnack';

import {
	app_page_urls,
} from './../model/core'

const {
	AcidFooter,
	AcidBagCheckoutRecepit,
	useBurnStyles,	
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');


const burn2 = require("./../assets/burn2.jpeg")


/******************************************************
	@constants + view components
******************************************************/

const lorem_ = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit"


// featurebox text
// So if you voted 50 times and lost each one, you will still earn 1 tab!`}
const featurebox_datasource1 = [
    {idx: 0, key: `1. Lorem ipsum` , value: lorem_}, 
    {idx: 1, key: `2. Lorem ipsum` , value: lorem_}, 
    {idx: 2, key: `3. Lorem ipsum` , value: lorem_}, 
	/*
    {idx: 0, key: `Pen Manifestos`  , value: `Earn 5 tabs for every manifesto you write to kindle a movement.`},
    {idx: 1, key: `Earn Burn Tabs`  , value: `Earn 1 tab each time you sign a manifesto.`},
    {idx: 2, key: `Share burn tabs` , value: `Gift tabs to community members to complete their initiation, or invite new members into the movement by staking tabs.`},
	*/
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
function AppBurnMobile(props){

	/******************************************************/
	// mount + responders

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const { navigate } = props;


	function onGotoBurnTab(){
       	navigate("/firehose")
	}

	function onInstall(){ 
		// let { download } = app_page_urls({ chain_id: "" })
		// window.open(download);
		alert("Coming soon!")
	}

	/******************************************************/
	// views

	const text_style = { color: COLORS.text, opacity: 0.90 }

	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}


	return (
		<div style={bg_style}>
			<div>
	        <Helmet>
	            <title>{"The Little Red App"}</title>
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
					{ [0,1,2,3,4,5,6,7].map((data, idx) => {
							if ( data === 0 ){
								return (
									<Stack 
										key={idx}
										direction='row' 
										className={bstyle.footer} 
										style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
									>
										{'A communal ☺ booth'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to feel ☺ the burn'.toUpperCase()}
									</Stack>
								)
							} else if ( data === 1) {
								return (
									<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='row'>
										{'The little red app'.toUpperCase()}
									</Stack>
								)
							} else if ( data === 2) {
								return (
									<Stack key={idx} className={bstyle.body} direction='row' style={{...text_style, marginTop:'24px'}}>									
										<p>
											{"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris, ac volutpat tortor lacus sed velit. Integer consequat volutpat leo quis congue."}
											<br/><br/>
											{"Praesent laoreet sem vel nisi finibus cursus. Donec imperdiet quis ex aliquet mattis. Mauris tincidunt, metus eget iaculis molestie, mi metus semper lacus, vitae pharetra massa ante non quam. Curabitur at hendrerit nisi. Maecenas tincidunt porta nulla non pretium. Proin metus nunc, lacinia ac nunc sed, rutrum tincidunt nibh. Pellentesque bibendum imperdiet diam quis malesuada. Mauris aliquam libero turpis, at viverra risus ultrices in."}
										{/*

											{`The little red app is where you initiate community members into the movement. Initiate new members by depositing the `}
											<span style={link_style} onClick={onGotoBurnTab}>
												{`burn tabs`}
											</span>
											{` you have earned into their initiation packet.`}
											<br/><br/>
											{`For every one tab you share with community members, the burn timer extends by 30 minutes. So long as members share tabs, the movement will never burn out.`}
										*/}											
										</p>
									</Stack>
								)
							} else if (data === 3){
								return (
									<Stack direction='column' key={idx}>
									<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'24px'}}>
										{`What you can do on the little red app:`}
									</div>
			                        <FeatureBox 
				                        always_on
			                            datasource = {featurebox_datasource1}
			                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
			                            style={{
			                            	height:'fit-content',
			                            	margin: '24px',
			                            	width: `calc(50vw-24px)`,
			                            	border: `0.25px solid ${COLORS.text3}`
			                            }}
			                        />
			                        </Stack>
			                    )
							} else if ( data === 4) {
								return (
									<Stack className={bstyle.body} direction='row' style={{...text_style, marginTop:'12px'}} key={idx}>
										<p>
											{"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris, ac volutpat tortor lacus sed velit. Integer consequat volutpat leo quis congue."}										
											{/*
											{` Read more about how to acquire burn tabs `}
											<span style={link_style} onClick={onGotoBurnTab}>
												{`here.`}
											</span>												
											*/}
										</p>
									</Stack>
								)						
							} else if ( data === 5 ){
								if ( isOnMobile ){
									return (
										<AcidBagCheckoutRecepit
											{...props}
											is_bare
											title="** Order Summary"
										/>
									)
								} else {
									return (<div/>)
								}
							} else if ( data === 6 ){
								return (
									<AcidFooter 
										key={idx} 
										style={{marginTop: isOnMobile ? "-24px" : '0px', marginBottom:'48px'}}
										btn_str={"Feel the Burn"}
										onClick={onInstall}
									/>
								)
							} else {
								return (<div/>)
							}
						})
					}
				</div>					
				{ isOnMobile 
					? 
					<div/> 
					:
					<Stack direction='column' style={{width:'50vw', background:COLORS.black}}>
						<AcidBagCheckoutRecepit
							{...props}
							is_bare
							title="** Order Summary"
							style={{width:'45vw', height: 'fit-content', marginTop:'20vh'}}
						/>
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}

export default withSnack(AppBurnMobile);
































