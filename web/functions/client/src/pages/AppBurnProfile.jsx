/**
 *
 *
 * @Package: AppBurnProfile
 * @Date   : Oct 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from "@material-ui/core/Grid";

import { GiphBackgroundView } from './../components/VideoBackground';
import { COLORS }    from './../components/constants';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import withSnack from './../hoc/withSnack';

import {
	cap,
	trivialNum,
	trivialProps,
	trivialString,
	removeAllSpaces,
	swiftNow,
	roundTo,
	force_to_num,
	ppSwiftTime,
	contractMetamaskAddress, 	
	parseSeverTimeStamp,
} from './../model/utils'

import {
	toTokenContentKind,
    urlToFileExtension,
    erc_721_tok_opensea_url,
    ItemMintState,
    to_social_links,
} from './../model/core'

import { DarkButton } from './../components/ButtonViews';

import { Text_H1 } from './../pages/AboutSaleView';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { AppTextField } from './../components/ChatTextInput'
import { CenterHorizontalView, CenterVerticalView, } from './../components/UtilViews';
import DragToSave from './../components/DragToSave';
import { ActionProgressWithProgress } from './../components/ButtonViews';
import AppImageView from './../components/AppImageView'
import {CubeTableWithImage} from './../components/CubeTable'

import {
	useNftvieWstyles,
} from './AppStoryboardFragments';

import { 
	ExplainCard,
	NonfungibleTokenCard,
} from './../components/NonFungibleTokenCard';


const {
	AcidBagImage,
	AcidFooter,
	useBurnStyles,	
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');


const burn2 = require("./../assets/burn2.jpeg")
const burn1 = require("./../assets/burn1.jpeg")
const cubetable = require("./../assets/cubetable.png");


/******************************************************
	@View exported
******************************************************/
/**
 *
 *
 * @Use: one app storyboard pannel
 *
**/
function AppBurnProfile(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();
	const bstyle = useBurnStyles(isOnMobile)();

	const { 
		chain_service,
		user_cache,
		tellUser,		
		navigate,
		location,
	} = props;

	// page data
	const [ is_authed, eis_authed ]   = useState(false);
	const [ loaded, eloaded ]         = useState(false);
	const [ user, euser ]             = useState("");
	const [ datasource, edatasource ] = useState([]);

	useEffect( async () => {
		if ( !user_cache.isAuthed() ){
			navigate('/')
		} else {
			await mount();
		}        
	},[]);

	// @Use: mount by burn name
	//       or burn invite code
	async function mount(){

        const { pathname } = location
        let url = pathname.replace('/','')
        const bits = url.split('/');

        if ( bits.length <= 1 ){
        	return;
        }

        let subdomain_0 = bits[0];
        let subdomain   = bits[1];

        if ( subdomain_0 !== 'profile' ){
        	return navigate('/');
        }

        // get user 
        await user_cache.get({ userID: subdomain, then: async (user) => {
        	if ( trivialProps(user,'userID') ){
        		navigate('/')
        	} else {
        		euser(user)
				let admin =  await user_cache.getAdminUser();
				if ( !trivialProps(chain_service,'fetch_all_tokens_by') ){
					await chain_service.fetch_all_tokens_by({ userID: subdomain, then: async ({ data }) => {
						let _datasource = [{},user].concat(data);
						edatasource(_datasource);
						eis_authed(true);
						eloaded(true);
					}})
				} else {
					edatasource([{},user])					
				}       
        	}
        }});

    }

    function onGoToMobile(){
    	navigate(`/thelittleredapp`)
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
	        <Helmet>
	            <title>{"Profile"}</title>
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


			<div className={tclasses.scroll_container_alt} style={{height:'100vh'}}>
				<Grid 
					container 
					spacing={0} 
					columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
				>
					<Stack direction='column' style={{width:'100vw'}}>
						<Stack 
							direction='row' 
							className={bstyle.footer} 
							style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
						>
							{'the ☺ profile'.toUpperCase()}
				            <Box sx={{ flexGrow: 1 }} />
							{`for lumo ☺ burner`.toUpperCase()}
						</Stack>
						<div className={bstyle.title} style={{fontSize:'48px'}}>
							{("** Profile").toUpperCase()}
						</div>
					</Stack>

					{datasource.map((data,index) => (
						<Grid item xs={12} sm={12} md={6} lg={4} key={index}>
						{ index === 0 
							?
							<ExplainCard
								title='Lumo'
								h1 = {'* Did you know we have a mobile app?'}
								h2 = {`Download here`}
								header={"Community Note"}
								buttonLabel='Download'
								onClickButton={onGoToMobile}
								style={{}}
							/>
							:
							index == 1 
							?				
					        <NonfungibleTokenCard
					        	style={{
					        		margin:'8px',
					        		marginTop:'16px',
					        		marginBottom: '16px',
					        	}}
					        	card_style={{background:COLORS.offBlack}}
					        	data         = {data}
					        	header_left  = {''}
					        	header_right = {''}
								t1_left     = {`Profile Card`}
								t1_right    = {''}
								t2          = {data.get_name() ?? ""}
								t3_left     = {''}
								t3_right    = {""}
								t4_top      = {'Joined on'}
								t4_middle   = {parseSeverTimeStamp({ timeStamp: data.timeStampCreatedPP ?? "", split: true})[0]}
								t4_bottom   = {parseSeverTimeStamp({ timeStamp: data.timeStampCreatedPP ?? "", split: true})[1]}
								t5_top      = {""}
								t5_bottom   = {""}
								footer_left  = {""}
								footer_right = {'show more'}
								image_url   = {data.profile_image_preview_url ?? ""}
								table_title = {""}
								table_data_source = {[]}
								hide_table_values = {true}
								seed_str = {""}
								onClickt3right     = {cap}
								onClickTitle       = {cap}
								onClickt5_bottom   = {cap}
								onClickUser        = {cap}
							/>
							:
					        <NonfungibleTokenCard
					        	style={{
					        		margin:'8px',
					        		marginTop:'16px',
					        		marginBottom: '16px',
					        	}}
					        	card_style={{background:COLORS.offBlack}}
					        	data         = {data}
					        	header_left  = {''}
					        	header_right = {''}
								t1_left     = {`${contractMetamaskAddress({ pk: data.contract_address, m: 3, n: 5})}/${data.id}`}
								t1_right    = {''}
								t2          = {data.token_sym ?? ""}
								t3_left     = {'Price:'}
								t3_right    = { trivialProps(data.price_in_eth) ? "" : `${data.price_in_eth}ETH`}
								t4_top      = {'Purchased on'}
								t4_middle   = {parseSeverTimeStamp({ timeStamp: data.timeStampCreatedPP ?? "", split: true})[0]}
								t4_bottom   = {parseSeverTimeStamp({ timeStamp: data.timeStampCreatedPP ?? "", split: true})[1]}
								t5_top      = {'receipt'}
								t5_bottom   = {contractMetamaskAddress({ pk: data.payment_hash ?? "", m: 3, n: 5 })}
								footer_left  = {""}
								footer_right = {'show more'}
								image_url   = {data.image ?? ""}
								table_title = {""}
								table_data_source = {[]}
								hide_table_values = {true}
								seed_str = {""}
							/>
						}
						</Grid>
					))}
				</Grid>
			</div>
		</div>
	)
}

export default withSnack(AppBurnProfile);




