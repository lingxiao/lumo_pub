/**
 *
 *
 * @Package: AppOnboardPage
 * @Date   : 7/9/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import AppFooter from './../components/AppFooter';
import AppSnackbar from './../components/AppSnackbar';
import Stack from '@mui/material/Stack';
import Grid from "@material-ui/core/Grid";


import AppHeaderPage from './AppHeader';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {
	cap,
	trivialProps,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'

import {
	Networks,
	daboutProject,
	urlToFileExtension,
	GLOBAL_STAGING,
} from './../model/core';

import {
	queryMetaMask
} from './../model/api_web3';

import { CenterVerticalView, CenterHorizontalView } from './../components/UtilViews';
import AppImageView from './../components/AppImageView'
import {UploadByDragAndSave} from './../components/CubeTableFileUpload'
import { ActionProgressWithProgress } from './../components/ButtonViews';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';

import { COLORS } from './../components/constants'
import { useStyles } from './../components/AppBodyTemplate';

import { InviteImageBlock, TwitterCardHero } from './AppInvitePage'

import cube_1 from './../assets/1.jpg'
import cube_2 from './../assets/2.jpg'
import cube_3 from './../assets/2-blur.png'
import cube_3S from './../assets/2-blur-small.png'
import lumoCubeLogo from './../assets/lumoCubeLogo.png';

import TypewriterText from "./../components/TypewriterText";
import { AppTextField } from './../components/ChatTextInput'

import {
	useNftvieWstyles,
	FeatureBox,
} from './AppStoryboardFragments';

import SplitTable from './SplitTable';
import DialogAuthWithEmail from './../dialogs/DialogAuthWithEmail';

import {
	ETHERSCAN_TX_LINK,
	ETHERSCAN_ADDRESS_LINK,
} from './../model/core';

import { GiphBackgroundView } from './../components/VideoBackground';


import StoryboardModel from './../model/storyboardModel';

/******************************************************
	@View exported
******************************************************/


const PageState = {
	'one'  : 1,
	'two'  : 2,
	'three': 3,
	'four' : 4,
}

const dpname = '';
const dsym   = ''

/**
 *
 * @Use: app template view w/ progressive
 *       loading of different elemnents
 *
**/
function AppOnboardPage(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		location,
		nft_cache,
		user_cache,
		navigate,	
		reauthenticate,
		job_cache,
		web3_job_cache,
		_hoc_does_user_have_account,	
		_hoc_sign_up_with_metamask,
	} = props;


	// get data
	const [ pg_st, epg_st ] = useState(PageState.one);
	const [ update, eupdate ] = useState(0)
	const [ storyboard, estoryboard ] = useState({});

	const [ license_item, elicense_item ] = useState({});
	const [ license_user, elicense_user ] = useState({});

	// view states
	const [ address, eaddress ] = useState("")
	const [ showProgress, eshowProgress ] = useState(false);

	const [ invite_text, einvite_text ] = useState({
		img_url: cube_2,
		t1: 'You have been invited',
		t2: '',
		t3: '',
		t4: '',
		t5: "",		
	})

	/// load data
	useEffect(async () => {
		setTimeout(async () => {
			await mount()
		},1000)		
		setTimeout(async () => {
			await mount()
		},2000)		
	},[]);

	async function mount(){

		let user = await user_cache.getAdminUser();
		if ( !trivialProps(user, 'metamask_pk') ){
			let addr = contractMetamaskAddress({ pk: user.metamask_pk, n: 5, m:3 })
			eaddress(addr)
		}

		const { pathname } = location;
	    let url    = pathname.replace('/','')
	    const bits = url.split('/');

		if ( bits.length > 1 ){
			let license_id = bits[1];
			await StoryboardModel.get_item_by_license_id({
				licenseID: license_id,
				then: async ({ success, data }) => {
					if ( !trivialProps(data,'ID') ){

						elicense_item(data);
						eregister_btn_label("Seal license")

						let { userID } = data;
						await user_cache.get({ userID, then: (user) => {
							
							elicense_user(user ?? {});

							// set invite text
							var res = {};
							res['t2'] = 'to claim an'
							res['t3'] = 'exclusive license'
							res['t4'] = `on 0xPARC`
							res['t5'] = user.name ?? "";
							res['img_url'] = data.image_url ?? cube_2;
							einvite_text({ ...invite_text, ...res });

						}});
					}
				}
			})
		} else {
			var res = {
				img_url: cube_2,
				t1: `You have been invited`,
				t2: `To establish a defi`,
				t3: `creator house`,
				t4:'on 0xPARC',
				t5: "",						
			}			
			einvite_text({ ...invite_text, ...res });
		}
	}

	/***********************************************************/
	// change page view

	// checkuser auth, advance page
	async function onAcceptInvite(){

		tellUser("");
		let user = await user_cache.getAdminUser();

		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			tellUser("Please sign up first. See top right corner of your screen")
			setTimeout(() => { tellUser("") },3000);
		} else {
			epg_st(PageState.two);
		}
	}

	// @use: on did sync storyboard, update slate
    async function on_go_to_story({ address }){
    	let addr = address ?? storyboard.eth_address;
        if ( !trivialString(addr) ){
            navigate(`/house/${addr}`)
        } else {
        	tellUser("Address not found")
        }
    }

    function on_go_to_contract(){
        let win = window.open(`${ETHERSCAN_ADDRESS_LINK()}/${contract_address}`, '_blank');
        win.focus();

    }
	
	function on_go_to_tx(){
        let win = window.open(`${ETHERSCAN_TX_LINK()}/${deployed_hash}`, '_blank');
        win.focus();
	}

	function on_go_to_safe(){
        let win = window.open(`${ETHERSCAN_ADDRESS_LINK()}/${safe_address}#code`, '_blank');
        win.focus();		
	}


	/***********************************************************/
	// auth by email modal reponsder

    const [ open_email, eopen_email ] = useState(false);

    // on did auth, close modal and 
    // show new page
    function onHandleAuthClose(didAuth){
    	eopen_email(false);
    	if ( didAuth ){
	    	epg_st(PageState.two)
	    }
    }

	/***********************************************************/
	// project creation page

	const [ show_drop_img, eshow_drop_img ] = useState(true);
	const [ ibtn, eibtn ] = useState( show_drop_img 
		? 'next'
		: "Upload project image"
		)

	const [  project, eproject ] = useState({
		name : dpname,
		sym  : dsym,
		about: daboutProject,
		image: {},
	})

	/**
     *
     * @use: on upload image, either
     *      upload image, or go to next page
     *
	*/
	async function onPressUploadImage(){

		const { name, sym, image } = project;

		function bad(str,dstr){
			return trivialString(str) || str === dstr
		}

		// save all project info
		if ( trivialProps(image,'type') ){

			if ( bad(name, dpname) ){
				return tellUser("Please enter project name")
			} else if ( bad(sym, dsym)){
				return tellUser("Please enter project ticker symbol")
			} else {
				tellUser("Please upload project poster image")
				eshow_drop_img(true);
				eibtn("next");
			}

		} else {

			// post film
			let _slot = {
				slate_id: "",
				slate_idx_x: 0,
				slate_idx_y: 0,
			}
			eshowProgress(true);

            await job_cache.post_film_proposal({
                slot         : _slot,
                name         : name,
                about        : "",
                symbol       : sym,
                twitter      : "", 
                instagram    : "",
                website      : "",
                discord      : "",
                logo_file    : {},
                poster_file  : image,
                trailer_file : {},
                then_uploading: (str) => { tellUser(str) },
                then_progress: (str) => { tellUser(str) },
                then: async ({ success, message, address }) => {

                    if ( !success || trivialString(address) ){

                        eshowProgress(false);
                        return tellUser(message);

                    } else {

                        tellUser('One more second!');

						await nft_cache.getStoryBoard({ address: address, fast: false, then: async (storyboard) => {

							estoryboard(storyboard);


	                        setTimeout(async () => {
	                            // if user does not have metamask then go to page directly
								await _hoc_does_user_have_account({ then: async({  metamask_found }) => {	
									if ( metamask_found ){
			                            eshowProgress(false);
										epg_st(PageState.three);
										tellUser("");
									} else {
			                            eshowProgress(false);
										on_go_to_story({ address });
									}
								}})
	                        },1000)

						}})

                    }
                }
            })

		}
	}

	/***********************************************************/
    // deploy contract page

    const [ hideBtn, ehideBtn ] = useState(false);
    const [ register_btn_label, eregister_btn_label ] = useState('launch');

    // deploy states
    const [ deployed_hash, set_deployed_hash ]       = useState('');
    const [ contract_address, set_contract_address ] = useState("");
    const [ safe_address, esafe_address ]            = useState("");
    const [ no_eth, eno_eth ] = useState(0);

    /**
     *
     * @Use: deploy contract
     *     1. check user is owner
     *     2. check can deploy contract
     *     3. deploy contract and monitor status
     *
    */
    async function onDeployContracts(){

        eshowProgress(true);
	
        if ( trivialProps(storyboard, 'eth_address') ){

        	return tellUser("Oh no! A problem occured!")

        } else  if ( !trivialString(safe_address) ){

			return on_go_to_story({ address: storyboard.address ?? "" });

		} else if ( no_eth ){

			navigate(`/house/${storyboard.eth_address ?? ""}`);

        } else {

        	await queryMetaMask({ then: async ({ chainId }) => {
        		if ( !GLOBAL_STAGING && chainId !== Networks.mainnet  ){
        			eshowProgress(false)
        			return tellUser("Please switch to Ethereum mainnet!")
        		} else {        			
        			await _go_deploy_contract();
        		}
        	}});
        }
    }

    async function _go_deploy_contract(){

        tellUser("Deploying multi-token standard and treasury, you will be asked to sign twice.");

        let addr = storyboard.eth_address;

        await web3_job_cache.deploy_contract({

        	// erc1155 name + symbol
        	cname  : project.name ?? "",
        	csymbol: project.sym  ?? "",

        	storyboard: storyboard,
        	address: storyboard.eth_address,

        	then_will_deploy: () => {
		        eregister_btn_label(`Step 1/4: checking a multi-token contract can be deployed`)
        	},
        	then_cannot_deploy: async ({ message, no_eth }) => {
    			tellUser(message)
				eshowProgress(false);
    			if ( no_eth ){
    				eno_eth(no_eth);
    				eregister_btn_label("Skip for now");
    				if ( !trivialProps(license_item,'license_id') ){
		    			tellUser("Your house has been created but the item cannot be licensed because you did not deploy a multitoken standard.");	    			
		    		}
    			} else {
	    			eregister_btn_label('try again')
	    		}
        	}, 
        	then_can_deploy: () => {
        		eregister_btn_label(`Step 2/4: deploying multi-token standard`);
        	},
        	then_deploy_failed: ({ message, no_ether, deployed_erc1155 }) => {

    			tellUser(message);

    			if ( typeof no_ether === 'boolean' && no_ether ){

    				if ( trivialProps(license_item,'license_id') ){
	    				tellUser("Just a few seconds while we redirect you...")
	    			} else {
	    				tellUser("Your house has been created but the item cannot be licensed because you did not deploy a multitoken standard. Redirecting you now...")
	    			}

	    			setTimeout(() => {
						navigate(`/house/${storyboard.eth_address ?? ""}`);
						eshowProgress(false);
	    			},2500)
	    		} else {
	    			eshowProgress(false);
	    			eregister_btn_label('try again');;	    			
	    		}
        	},
        	then_deploy_progress: (str) => {
        		eregister_btn_label(`Step 2/4: monitoring block approval`)
        		tellUser(str)        		
        	},        	
        	then_deployed: async ({  success, message, can_deploy, hash, data, raw_data }) => {

        		if ( !success ){
        			tellUser(message)
	        	} else {

	        		tellUser(`Deployed multi-token standard. Please wait while we monitor the chain for deployment progress`)
	        		eregister_btn_label(`Step 2/4: succeeded`);	        		
        			set_deployed_hash(hash)

					// license license_item if it exists
					if ( !trivialProps(license_item, 'license_id') && !trivialProps(storyboard,'claim_license') ){
						setTimeout(() => {
							tellUser("licensing item")
						},3000);
						const { license_id } = license_item;
						await storyboard.claim_license({ licenseID: license_id ?? "", then: cap });
					}       			
	        	}
        	},
        	then_deploy_safe: (str) => {
        		tellUser(str);
	        	eregister_btn_label(`Step 3/4: deploying treasury`);	        		        		
        	},
        	then_deployed_safe: (str) => {
        		eregister_btn_label("Step 3/4: treasury deploying")
        		tellUser(str);
        	},
        	then_deploy_safe_fail: (str) => {
        		eregister_btn_label("The treasury failed to deploy");
        		tellUser(str);        		
        	},
        	then_deploy_progress_done: async ({ success, message, safe_address, data }) => {

       			tellUser(message);
       			eregister_btn_label('');
       			ehideBtn(true);

       			await load_contract_data({ then: () => {
	       			eshowProgress(false)
	       			esafe_address(safe_address ?? "")
	   				tellUser(`Deployed! If you see a contract address here, it has been deployed successfully. However, it will take a while for etherscan to update, so be patient! Next, you will be asked to confirm how you will split the payout from your multi-token contract.`)
	   				ehideBtn(true);
					eregister_btn_label("...")
					setTimeout(() => {
						epg_st(PageState.four);
					},3000)
       			}});					
        	}
        });
    }


    //@use: load contract address or recepit hash
    async function load_contract_data({ then }){
    	if ( trivialProps(storyboard, 'sync') ){
    		return then()
    	}
    	await storyboard.sync({ reload: true, fast: true, then: () => {
	    	let contract = storyboard.get_contract({ at: "" });    		
	    	if ( !trivialProps(contract,'contract_address') ){
		    	const { contract_address} = contract;
		    	set_contract_address(contract_address ?? "");
		    	then()
		    } else {
		    	then()
		    }

    	}})
    }

    //@use: on splits done redirect to home page
	function didChangeSplits(){
		tellUser("You splits have been updated, you will be redirected to your house page in a few seconds");
		setTimeout(() => {
	        let addr = storyboard.eth_address;		
			navigate(`/house/${addr ?? ""}`)
		},3000);
	}

	/***********************************************************/
    // render

	// snack
    const [ snack_content, setSnackContent] = useState({ show: false, str: "" });
    function tellUser(snack_message){
    	if ( !trivialString(snack_message) ){
			setSnackContent({ show: true, str: snack_message ?? "" });
		} else {
			setSnackContent({ show: false, str: "" })
		}
	}

    function bg_color(){
    	return 'transparent'
    }


	return (
		<div>
	        <Helmet>
	            <title>{'You are invited!'}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay 
				pushLeft 
				darken 
				showVignette 
				image_url={cube_3S} 
				preview_url={cube_3S} 
			/>

			<AppHeaderPage 
				{...props} 
				showLeft
				delay_bg = {30}
				in_full_screen_mode = {false}
				header_gradient = {{background: bg_color()}}
				name={'0xPARC'}
				tellUser={tellUser}
			/>
            <AppSnackbar
                showSnack    = {snack_content.show}
                snackMessage = {snack_content.str}
                vertical={"bottom"}
                horizontal={"right"}
            />    			
			<div 
				className={ classes.bodyContainer } 
				style={{background: bg_color() }}
			>
				<div className={tclasses.scroll_container}>
				{
					pg_st === PageState.one
					?
					<TwitterCardHero 
						{...props}
						update   = {update}
						img_url  = {invite_text.img_url}
						t1   = {invite_text.t1}
						t2   = {invite_text.t2}
						t3   = {invite_text.t3}
						t4   = {invite_text.t4}
						name = {invite_text.t5}
						address  = {address}
						host     = {invite_text.t5}
						onAccept ={onAcceptInvite}
						showProgress={showProgress}
						storyboard={{}}
						progress_text = {'one moment'}				
						footer_style = {{ background: COLORS.offBlack }}
						style={{marginTop:'36px'}}
					/>		
					:
					pg_st === PageState.two
					?
					<Grid container spacing={0} style={{width:'100%',height: '100%'}} columns={{ xs: 1, sm: 1, md: 2, lg: 2 }}>
						<Grid item xs={12} sm={12} md={6} lg={6} key={0} style={{paddingTop: '3vh'}}>
				        	<CenterVerticalView style={{height:'100%'}}>		
					            <CenterHorizontalView>	
				        		<div style={{ ...inputPropsAbout, fontSize:'14px', width:'87%', height: 'fit-content' }}>
				        			{ trivialProps(license_item,'ID')
				        				? "Please tell us a little more about your project"
				        				: 'Please tell us where you will use this license:'
				        			}
				        		</div>		        		
				        		</CenterHorizontalView>
					            <CenterHorizontalView style={{marginTop:'3vh'}}>
						            <AppTextField
						                standard
						                autoFocus
						                hiddenLabel
						                label      = 'house name'
						                value      = {project.name}
						                onChange   = {(e) => { eproject({ ...project, name: e.target.value ?? ""}) }}
						                className  = {classes.row_2}                            
						                inputProps = {{style: inputPropsTitle}}
						                style={{width:'87%'}}
						            />
					            </CenterHorizontalView>
					            <CenterHorizontalView style={{marginTop:'3vh'}}>
						            <AppTextField
						                standard
						                hiddenLabel
						                label = 'house ticker (3 letters only)'
						                value = {project.sym}
						                onChange={(e) => { 
						                	let v  = e.target.value ?? "";
						                	let sv = v.slice(0,3)
						                	eproject({ ...project, sym: sv });
						                }}
						                className={classes.row_2}                            
						                inputProps={{style: {...inputPropsTitleH2, fontSize:'3vh'}}}
						                style={{width:'87%'}}
						            />
					            </CenterHorizontalView>					            
						            {  true 
						            	? <div/> 
						            	:
							            <CenterHorizontalView>            
								            <AboutAttributeSimple
								                numLines = {20}
								                value    = {project.about}
								                onChange = {e => { eproject({ ...project, about: e.target.value ?? ""}) }}
								                style    = {{width:'85%',marginTop:'3vh', borderRadius:'0px'}}
								            />        
							            </CenterHorizontalView> 
							        }
					            <br/>
	                            <ActionProgressWithProgress
	                                label={ibtn}
	                                showProgress={showProgress}
	                                onClick = {onPressUploadImage}
	                                sx={{width:'120%'}}
	                            />  
	                            <br/>                           					            
				            </CenterVerticalView>
				        </Grid>  
						<Grid item xs={12} sm={12} md={6} lg={6} key={1}>
				        	<CenterVerticalView style={{height:'100%'}}>
				        	{ 	
				        		show_drop_img  
				        		?
					        	<CenterHorizontalView>
					        		<Stack direction='column' style={{height: '100%', marginLeft: isOnMobile ? '0px' : '-3vw'}}>
						        	<CenterHorizontalView style={{marginBottom:'12px'}}>
						        		<div style={{ ...inputPropsHash, fontSize:'14px', height: 'fit-content' }}>
						        			{'Project Poster'}
						        		</div>		        
						        	</CenterHorizontalView>
						            <UploadByDragAndSave 
						            	bordered 
						            	handle_did_drop={(f) => {
						            		eproject({ ...project, image: f })
						            	}}
						            	style={{marginTop: isOnMobile ? "0px" : '0px'}}
						            	cubeBackgroundColor={bg_color()}
						            />           
						            </Stack>
					        	</CenterHorizontalView>
					            :
		                        <AppImageView 
                                    preview_url  = {invite_text.img_url}
		                            imgSrc       = {invite_text.img_url}
		                            videoSrc     = {invite_text.img_url}
		                            width       = {'100%'}
		                            height      = {'100%'}
		                            type        = {urlToFileExtension(invite_text.img_url)}
		                        />
		                    }
				        	</CenterVerticalView>
				        </Grid>
			        </Grid>  	
			        :
			        pg_st === PageState.three  
					?			        
					<Stack direction='column' style={{ 
						paddingLeft: '3vw', 
						paddingRight:'3vw', 
						height: 'fit-content',
						paddingTop: '12px',		
					}}>

						<CenterHorizontalView>
							<div style={{...textFieldStyle, ...inputPropsTitleA, textAlign: 'center', marginTop:'2vh'}}>
							{ trivialProps(license_item,'ID')
								? 'Launch your defi creator house'.toUpperCase()
								: 'Seal the license in your creator house'.toUpperCase()
							}
							</div>
						</CenterHorizontalView>

			            { 	false
			            	?
			            	<div/>
			            	:
			            	isOnMobile
			            	?
				            <div style={{...inputPropsAbout,width:'100%',  marginTop: '-36px' }} >
				            	{about_721_a}
				            </div>
			            	:
				            <Stack direction='column'>
					            <div style={{...inputPropsAbout,width:'100%', textAlign:'center'}} >
					            	{about_intro}
					            </div>
					            <Stack direction='row' style={block_style} >
					            	<div style={{...inputPropsAboutH1, width:'45%'}}>
					            		{'* We use the OpenZeppelin multi-token standard that interops with OpenSea.'}
					            	</div>
					            	<div style={{...inputPropsAbout, width:'55%', marginTop: '-36px', marginLeft:'24px'}}>
					            		{about_erc1155}
					            	</div>
					            </Stack>
					            <Stack direction='row' style={block_style} >
					            	<div style={{...inputPropsAboutH1, width:'45%'}}>
					            		{'* Deploy a treasury to manage your war chest and retain supporters for the long run.'}
					            	</div>
					            	<div style={{...inputPropsAbout, width:'55%', marginTop: '-36px', marginLeft:'24px'}}>
					            		{about_treasury}
					            	</div>
					            </Stack>
					        </Stack>
						}
						{
							true 
							? 
							<div/> 
							:
							<div>
					            <div style={{...inputPropsAbout, width:'100%', textAlign:'center', marginTop: '36px', fontWeight: 'bold' }} >
					            	{ `${true ? `${about_intro} ` : ""}Here's what you can do with the 0xPARC defi hub:`}
					            </div>	  
					            <Stack direction={'column'} style={{ marginTop:'36px', width: '100%'}}>
					            	<FeatureBox 
					            		{...props} 
					            		no_bottom 
					            		datasource = {featurebox_datasource}
					            	/>
					            	<FeatureBox 
					            		{...props}
					            		no_top  
					            		datasource = {featurebox_datasource_gnosis}
					            	/>	            	
					            </Stack>
					            <div style={{...inputPropsAbout, marginTop: '36px', width: '100%', textAlign: 'center' }} >
					            	{about_721_b}
					            </div>	
					        </div>
					    }

					    {

					    	trivialProps(license_item, 'ID') 
						    	? 
						    	<div/> 
						    	: 
							    <div>
						            <div style={{...inputPropsAbout, width:'100%', textAlign:'center', marginTop: '36px', fontWeight: 'bold' }} >
						            	{ `Seal this license into your creator house:` }
						            </div>	  
									<CenterHorizontalView>
										<InviteImageBlock
											hide_button
											show_full_image
											name=""
											address=""
											img_url={invite_text.img_url}
										/>
				                    </CenterHorizontalView>
				                </div>
				        }

			            <div direction='row' style={{marginTop:'48px', width: '100%'}}>
			            { hideBtn 
			            	? 
			            	<div/> 
			            	:
			                <ActionProgressWithProgress
			                    showProgress={showProgress}
			                    onClick = {onDeployContracts}
			                    label={register_btn_label}
			                    progress_text={register_btn_label}
			                    style={{width:'100%'}}
			                />    
			            }
		                </div>

			            <Stack direction='column' style={{marginTop:'-12px', width: isOnMobile ? '100%' : '100%', marginBottom:'24px'}}>
							{
								trivialString(safe_address)
								?
								<div/>
								:
				                <CenterHorizontalView>
					                <div style={{...inputPropsContract, position: 'relative'}} onClick={on_go_to_safe}>
										<TypewriterText	delay={1000} onFinished={() => {return}} className='green' >
						                	{`Multisig wallet address: ${safe_address}`}
						                </TypewriterText>
					                </div>
				                </CenterHorizontalView>
							}	            
			            	{ !trivialString(contract_address)
				                ?
				                <CenterHorizontalView>
					                <div style={{...inputPropsContract, position: 'relative'}} onClick={on_go_to_contract}>
										<TypewriterText	delay={1000} onFinished={() => {return}} className='green' >
						                	{`ERC-1155 address: ${contract_address}`}
						                </TypewriterText>
					                </div>
				                </CenterHorizontalView>
				                :
				                !trivialString(deployed_hash)
				                ?
				                <CenterHorizontalView>
					                <div style={{...inputPropsHash, position: 'relative'}} onClick={on_go_to_tx}>
										<TypewriterText	delay={1000} onFinished={() => {return}} className='green' >
						                	{`contract deployment receipt: ${deployed_hash}`}
						                </TypewriterText>
					                </div>
				                </CenterHorizontalView>
				                :
				                <div/>
				            }
		                </Stack>
		                <br/><br/>		                
			        </Stack>
			        :
			        pg_st === PageState.four
			        ?
					<Stack direction='column' style={{ 
						paddingLeft: '3vw', 
						paddingRight:'3vw', 
						height: 'fit-content',
						paddingTop: '12px',		
					}}>

						<CenterHorizontalView>
							<div style={{...textFieldStyle, ...inputPropsTitleA, textAlign: 'center', marginTop:'2vh'}}>
							{ 'confirm your splits'.toUpperCase() }
							</div>
						</CenterHorizontalView>

			            <div style={{...inputPropsAbout,width:'100%', textAlign:'center'}} >
			            	{`Confirm how you will share the proceeds from sales. When you are done, press "Next"`}
			            </div>

			            <Stack direction={'column'} style={{ marginTop:'36px', width: '100%'}}>	
			            	<CenterHorizontalView>
				            	<SplitTable 
				            		{...props} 
				            		is_onboarding
									showProgress={showProgress}
									eshowProgress={eshowProgress}				            		
				            		storyboard={storyboard} 
			                        didChangeSplits={didChangeSplits}
				            		tellUser={tellUser}
				            	/>
			            	</CenterHorizontalView>
			            </Stack>
		                <br/><br/>		                
			        </Stack>			        
			        :
			        <div/>
				}	
				</div>
				{
					showProgress ? <AppFooter {...props} show_progress={showProgress}/> : <div/>
				}
			</div>
            <DialogAuthWithEmail
                {...props}
                open    = {open_email}
                handleClose={onHandleAuthClose}
            />                        
		</div>
	)   

}

/******************************************************
	@View: style

            <DialogSetting
                {...props}
                slot    = {active_slot}
                kind    = {StoryboardKind.new_board}
                address = {'header_address'}
                open    = {showNewStoryDialog}
                did_succeed_in_posting={did_succeed_in_posting}
                handleClose={() => { eshowNewStoryDialog(false) }}
            />            			

******************************************************/

const inputPropsTitle = {
    fontSize: `4vh`,
    fontFamily: 'NeueMachina-Bold',
    color     : COLORS.text,
    marginTop: '-32px',
}

const inputPropsTitleH2 = {
    fontSize: `3vh`,
    fontFamily: 'NeueMachina-Bold',
    color     : COLORS.text2,
    // marginTop: '-32px',
}


const about_intro = `
Funding a major movement is a slog and we are going to give you all the tools in the book to see it through. This decentralized finance (defi) hub is just the place to start.
`

const about_erc1155 = `
You may have minted non-fungible tokens (NFTs) or seen them on Twitter. Not only can you mint and batch mint NFTs here, all preminting is free and the mint cost is covered by the buyer. This means you can create many collections to test the market without spending any money.

If you are working with a crew to create the NFT collection, our multi-token standard allows you to define the splits so everyone receive their share. Transparent and frequent payments is the basis of a functioning team.
`

const about_treasury = `
But minting jpegs is the least creative possibility in defi, and certainly not the most lucrative. For larger projects trying to raise $500k or more, it maybe prohibitively expensive time wise to raise funds through an NFT campaign.

What you need here is a treasury with committed patrons. We whitelabel the multisignature wallet by Gnosis Safe, the wallet of choice in web3 with over $70b in total value locked. A multisig wallet is the home of the project treasury that arms you with a war chest for the long run. 
`

const about_721_a = `
${about_intro}
${about_erc1155}
${about_treasury}
`

const about_721_b = `
Deploy here. You will be asked to sign twice, once for your multi-token standard contract, and once to create your treasury.
`

const featurebox_datasource = [
	{key: '1. mint', value: 'Create an inventory tag for your media, and allow its free trade on an open and permissionless database. The buyers are paying for the mint cost.'},
	{key: '2. batch-mint', value: 'Create a set of inventory tags for many buyers. This option is great for whales who would buy a pack of nfts.'},
	{key: '3. split', value: 'Split the revenue from sales amongst all collaborators. Splits are tamper-proof and can only be changed by the contract owner.'}
]
const featurebox_datasource_gnosis = [
	{key: '4. initiate a fund', value: 'Create an inventory tag for your media, and allow its free trade on an open and permissionless database. The buyers are paying for the mint cost.'},
	{key: '5. issue member tokens'   , value: 'Create a set of inventory tags for many buyers. This option is great for whales who would buy a pack of nfts.'},
	{key: '6. build a community' , value: 'Split the revenue from sales amongst all collaborators. Splits are tamper-proof and can only be changed by the contract owner.'}
]

const block_style = {
	width:'100%', 
	marginTop:'36px', 
	paddingBottom: '24px', 
	borderBottom: `0.5px solid ${COLORS.surface3}` 	
}

const textFieldStyle = {
	width: '90%',
	marginTop: '36px',
	marginBottom: '54px'
}

const inputPropsTitleA = {
    fontSize   : `4vw`,
    fontFamily : 'NeueMachina-Black',    
    color      : COLORS.text,
    marginTop  : '-32px',
    textDecoration: 'underline'
}

const inputPropsAbout = {
	fontSize: '18px',
	fontFamily: 'NeueMachina-Regular',
	color: COLORS.text2,
	lineHeight: 1.5,
	// textSpacing: '1px',
	whiteSpace: "break-spaces",
}

const inputPropsAboutH1 = {
	fontSize: '36px',
	fontFamily: 'NeueMachina-Bold',
	color: COLORS.text2,
	lineHeight: 1.0,
}

const inputPropsHash = {
	cursor: 'pointer',
	color: COLORS.text,
    textShadow  : `var(--red-glow)`,
    fontSize: '18px',
    font: 'NeueMachina-Ultralight',
}

const inputPropsContract = {
	cursor: 'pointer',
	color: COLORS.text,
    textShadow  : `var(--green-glow)`,
    fontSize: '18px',
    font: 'NeueMachina-Bold',
}


/******************************************************
	@View: hero	
******************************************************/





export default withRouter(withAuth(AppOnboardPage));

