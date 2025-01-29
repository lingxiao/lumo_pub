/**
 *
 *
 * @Package: App mint page edit
 * @Date   : Oct 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import withSnack from './../hoc/withSnack';

import {
	cap,
	trivialProps,
} from './../model/utils'


import { DarkButton } from './../components/ButtonViews';

import { Text_H1 } from './../pages/AboutSaleView';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { AppTextField } from './../components/ChatTextInput'
import { CenterVerticalView, } from './../components/UtilViews';


const {
	AcidBagImage,
	AcidFooter,
	useBurnStyles,	
	UserProfileHeader,
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');

const burn1 = require("./../assets/burn1.jpeg")
const cubetable = require("./../assets/cubetable.png");

/******************************************************
	@constants + view components
******************************************************/

const lorem_ = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit"


// featurebox text
// So if you voted 50 times and lost each one, you will still earn 1 tab!`}
const featurebox_datasource1 = [
    {idx: 0, key: `1. Create Digital Merch Line` , value: ``},
    {idx: 1, key: `2. Deploy Sales Page` , value: ``},
    {idx: 2, key: `3. Fund Movement`     , value: ``},
]

const featurebox_datasource2 = [
    {idx: 0, key: `1. Lorem ipsum`   , value: lorem_}, // `A manifesto is the value statement of your community. Circulate your manifesto to ease people into your communal space.`},
    {idx: 1, key: `2. Lorem ipsum` , value: lorem_}, // `Garner signatures to build your community size. People who sign your manifesto are whitelisted for future merch drops, and will earn a tab for free.`},
    {idx: 2, key: `3. Lorem ipsum`            , value: lorem_}, // `Once you have gathered enough community momentum, drop merch to fund your movement and take it to the next level!`},
]

const featurebox_datasource3 = [
    {idx: 0, key: `1. Lorem ipsum`, value: lorem_}, // `30 minutes is added to the timer for every tab shared. The more tabs your community share, the longer the burn timer will last.`},
    {idx: 1, key: `2. Lorem ipsum`    , value: lorem_}, // `Each time someone is invited to the community or signs the manifesto, the timer increases by 30 minutes.`},
    {idx: 2, key: `3. Lorem ipsum`   , value: lorem_}, // `Sharing tabs is a great way for the community to come together and reconnect, without the stress of scrolling through Discord.`},
]

/*
// const featurebox_datasource2 = [
//     {idx: 0, key: `1. Circulate Manifesto`   , value: lorem_}, // `A manifesto is the value statement of your community. Circulate your manifesto to ease people into your communal space.`},
//     {idx: 1, key: `2. Collection Signatures` , value: lorem_}, // `Garner signatures to build your community size. People who sign your manifesto are whitelisted for future merch drops, and will earn a tab for free.`},
//     {idx: 2, key: `3. Drop Merch`            , value: lorem_}, // `Once you have gathered enough community momentum, drop merch to fund your movement and take it to the next level!`},
// ]

// const featurebox_datasource3 = [
//     {idx: 0, key: `1. Convey Communal Generosity`, value: lorem_}, // `30 minutes is added to the timer for every tab shared. The more tabs your community share, the longer the burn timer will last.`},
//     {idx: 1, key: `2. Measure Community Size`    , value: lorem_}, // `Each time someone is invited to the community or signs the manifesto, the timer increases by 30 minutes.`},
//     {idx: 2, key: `3. Promote Communal Action`   , value: lorem_}, // `Sharing tabs is a great way for the community to come together and reconnect, without the stress of scrolling through Discord.`},
// ]
*/


const inputPropsLink = {
    fontSize: '16px',
    fontFamily: 'NeueMachina-Regular',    
    color     : COLORS.text,
}

const inputPropsH2 = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Bold',    
    color     : COLORS.offBlack, // .black,
}

const bstyle2 = {
	borderRadius: 3,
	fontSize: '18px',		
	fontFamily: 'NeueMachina-Bold',
	marginLeft:'12px',
	color: COLORS.offBlack,
	background: 'transparent',
	maxWidth: '40vw',
}



/******************************************************
	@Acid tab page
*****************************************************


/**
 *
 * @Use: page for explaining burn page
 *
**/
function AppBurnPageEdit(props){

	/******************************************************/
	// mount

	const {
		chain_service,
		user_cache,
		tellUser,		
		navigate,
		location,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ chain, echain ] = useState({});
	const [ contracts, econtracts ] = useState([]);
	const [ _subdomain, esubdomain ] = useState("");
	const [ users, eusers ] = useState([]);
	const [ bname, ebname ] = useState("")
	const [ about, eabout ] = useState("About this collection");
	const [ social, esocial ] = useState({
		twitter  : "",
		instagram: "",
		youtube: "",
		website: "",
		discord: "",
	})

	const [ is_authed, eis_authed ] = useState(false);
	const [ loaded, eloaded ]   = useState(false);

	useEffect(async () => {

		if ( !user_cache.isAuthed() ){
			eis_authed(false)
		} else {
			eis_authed(true);
		}
		await mount({ then: cap });
	},[]);


	// @Use: mount by burn name
	//       or burn invite code
	async function mount({ then }){

        const { pathname } = location
        let url = pathname.replace('/','')
        const bits = url.split('/');

        if ( bits.length <= 1 ){
        	return then({});
        }

        let subdomain_0 = bits[0];
        let subdomain   = bits[1];
        esubdomain(subdomain);

        if ( subdomain_0 !== "burn" ){
        	return navigate("/");
        }

        // get chain
		await chain_service.fetch_chain_by_subdomain({
			subdomain,
			then: async (chain) => {
				if ( !trivialProps(chain, 'root') ){

					echain(chain);
					eusers(chain.items ?? []);

					// load edit state
					if ( user_cache.isAuthed() ){
						let user = await user_cache.getAdminUser();
						if ( chain.root.userID === user.userID ){
							eloaded(true);
							eabout(chain.root.about);
							ebname(chain.root.name);
							esocial({
								twitter  : chain.root.twitter ?? (user.twitterUserName ?? ""),
								instagram: chain.root.instagram ?? "",
								youtube: chain.root.youtube ?? "",
								website: chain.root.website ?? "",
								discord: chain.root.discord ?? ""
							});
							await chain.get_all_collections({ then: (cols) => {
								econtracts(cols ?? []);
							}})
						} else {
							eloaded(false);
							navigate("/")
						}
					} else {
						eloaded(false);
							navigate("/")
					}
				} else {
					eloaded(false);
					navigate("/")
				}
				return then(chain);
			}
		})
	}


	/******************************************************/
	// admin responders

	function onCreateMerch(){
		if ( !trivialProps(chain,'chain_id') && is_authed ){
			navigate(`/gas/${_subdomain}`)
		}
	}

	// @use: save chain root
	async function onSave(){
		if ( trivialProps(chain, 'update_chain_root') ){
			return tellUser("Please refresh")
		}
		await chain.update_chain_root({
			about     : about            ?? "",
			twitter   : social.twitter   ?? "",
			instagram : social.instagram ?? "",
			youtube   : social.youtube   ?? "",
			website   : social.website   ?? "",
			discord   : social.discord   ?? "",
			then: ({ success, message }) => {
				tellUser(message);
				if (success){
					navigate(`/burn/${_subdomain}`);
					window.location.reload(true);
				}
			}
		});
	}
	
	// @use: nav to contract
	function goToContract(contract){
		if ( trivialProps(contract,'ID') ){
			return tellUser("Please refresh");
		} else {
			navigate(`/gas/${_subdomain}/${contract.ID}`);
		}
	}

	/******************************************************/
	// views

	// compute number of tabs
	const text_style = { color: COLORS.text, opacity: 0.90 }
	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}


	return (
		<div style={bg_style}>
			<div>
	        <Helmet>
	            <title>{"Merch"}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay
				darken       
				no_video_bg
				image_url  = { burn1 }
				preview_url= { burn1 }
				containerStyle={{background:COLORS.red_1}}
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
					{  /// left side of the screen
						!loaded || !is_authed
						?
						<div/>
						:
						[-10,0,1,-1,2,3,4,5,6,7,8,9,10,11].map((data, idx) => {
							if ( data === -10 ){
								return (
									<UserProfileHeader {...props} flush_left={!isOnMobile} style={{marginLeft:'24px'}}/>
								)
							} else if ( data === 0 ){
								return (
									<Stack 
										key={idx}
										direction='row' 
										className={bstyle.footer} 
										style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
									>
										{'Admin ☺ Page'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'for your ☺ burn'.toUpperCase()}
									</Stack>
								)
							} else if ( data == 1) {
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <Text_H1 
							                left       = {"Burn"}
							                right      = {"Admin Page"}
							                style_left = {{fontSize:'48px'}}
							                style_right= {{fontSize:'36px'}}
							            />  
									</Stack>
								)			
							} else if ( data === -1 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							            	disabled
							                standard
							                label=""
							                value = {"Your Merchandise line"}
							                onChange={cap}
							                inputProps={{style: inputPropsH2}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
							            {
											(contracts ?? []).map((data, idx) => {
												return (
													<Stack key={idx} direction='column' onClick={() => goToContract(data)}>
														<div className={bstyle.body} style={{color:COLORS.surface1, cursor:'pointer', marginTop:'12px'}}>
															{`${data.token_sym}: ${data.title}`}
														</div>		
													</Stack>
												)
											})
							            }
							            <DarkButton 
							            	onClick={onCreateMerch}
							            	sx={{...bstyle2,marginBottom:'12px', marginTop:'12px'}}
							            > 
							            	{"Step 3. Create Merchandise"}
							            </DarkButton>					
							            { true ? <div/> : 
							            <div style={{marginLeft:'-12px'}}>
											<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'48px'}}>
												{ `What will happen when you "Create Merchandise":`}
											</div>
					                        <FeatureBox 
						                        always_on
					                            datasource = { featurebox_datasource1 }
					                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
					                            style={{
					                            	height:'fit-content',
					                            	margin: '24px',
					                            	width: `calc(50vw-24px)`,
					                            	border: `0.25px solid ${COLORS.text3}`
					                            }}
					                        />			
				                        </div>			
				                        }	            
							            <AppTextField
							            	disabled
							                standard
							                label=""
							                value = {"Burn Profile"}
							                onChange={cap}
							                inputProps={{style: inputPropsH2}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    								            
						            </Stack>
								)
							} else if ( data === 2 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AppTextField
							                standard
							                autoFocus
							                disabled
							                label="Burn Name"
							                value = { bname}
							                onChange={cap}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
						            </Stack>
								)																
							} else if ( data === 3 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AppTextField
							                standard
							                label="Twitter Link"
							                value = { social.twitter }
							                onChange={(e) => { 
							                    esocial({ ...social, twitter: e.target.value ?? "" })
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
						            </Stack>
								)
							} else if ( data === 4 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AppTextField
							                standard
							                label={"Discord Link"}
							                value = { social.discord }
							                onChange={(e) => { 
							                    esocial({ ...social, discord: e.target.value ?? "" })
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
						            </Stack>
								)		
							} else if ( data === 6 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AppTextField
							                standard
							                label={"Website"}
							                value = { social.website }
							                onChange={(e) => { 
							                    esocial({ ...social, website: e.target.value ?? "" })
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
						            </Stack>
								)				
							} else if ( data === 5 ){
							return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							                standard
							                label={"Instagram Profile"}
							                value = { social.instagram }
							                onChange={(e) => { 
							                    esocial({ ...social, instagram: e.target.value ?? "" })
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
							            <AppTextField
							                standard
							                label={"Youtube Link"}
							                value = { social.youtube }
							                onChange={(e) => { 
							                    esocial({ ...social, youtube: e.target.value ?? "" })
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    							            
						            </Stack>
								)				
							} else if ( data === 7 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AboutAttributeSimple
							                numLines = {20}
							                value    = {about}
							                onChange = {e => { eabout(e.target.value ?? "") }}
							                style    = {{
							                    marginTop:'28px', 
							                    height:'fit-content', 
							                    borderRadius:'12px',
							                    background:'transparent',
							                    border: `1px solid ${COLORS.red_3}`,
							                    width:'80%',
							                }}
							            />     
						            </Stack>
								)				
							} else if (data === 8){
								return (
									<div/>
							    )
							} else if (data === 9){
								return (
									<Stack key={idx} direction='column'>
										<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'48px'}}>
											{ `How to use this manifesto:` }
										</div>
				                        <FeatureBox 
					                        always_on
				                            datasource = { featurebox_datasource2 }
				                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
				                            style={{
				                            	height:'fit-content',
				                            	margin: '24px',
				                            	width: `calc(50vw-24px)`,
				                            	border: `0.25px solid ${COLORS.text3}`
				                            }}
				                        />	
							            <div style={{marginTop:'-12px'}}>
											<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'48px'}}>
												{ `What does the burn timer do:` }
											</div>
					                        <FeatureBox 
						                        always_on
					                            datasource = { featurebox_datasource3 }
					                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
					                            style={{
					                            	height:'fit-content',
					                            	margin: '24px',
					                            	width: `calc(50vw-24px)`,
					                            	border: `0.25px solid ${COLORS.text3}`
					                            }}
					                        />	
				                        </div>		
										<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'6px'}}>
											{'The burn timer is not a countdown to your merch drop, see "Create Merchandise" if you want to create a timer to that effect.'}
										</div>
									</Stack>
			                    )								
							} else if ( data === 10 ){
								return (
									<AcidFooter 
										key={idx} 
										style={{marginTop:'0px', marginBottom:'72px'}}
										btn_str={"Save"}
										onClick={onSave}
									/>
								)																																
							} else {
								return (
									<div/>
								)
							}
						})
					}
				</div>	
				
				{ isOnMobile  // right side of the screen
					? 
					<div/> 
					:
					<Stack direction='column' style={{width:'50vw', background: COLORS.offBlack }}>
						{	is_authed
							?
							<CenterVerticalView style={{height:'100vh'}}>
								<AcidBagImage
									img_name={cubetable}
									width={'40ww'}
									height={'40vw'}
									style={{
										background:COLORS.offBlack,
									}}
								/>
							</CenterVerticalView>
							:
							<div/>
						}
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}



export default withSnack(AppBurnPageEdit)




