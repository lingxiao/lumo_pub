/**
 *
 *
 * @Package: AppStoryProfile
 * @Date   : June 2nd, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import { 
	BootstrapTooltip ,
	CenterHorizontalView,
	CenterVerticalView	,
} from './../components/UtilViews';

import AppImageView from './../components/AppImageView'
import { AppTextField, AppTextFieldNoUnderLine } from './../components/ChatTextInput'

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import { COLORS }    from './../components/constants';
import { useStyles } from './../components/AppBodyTemplate';
import { ActionProgressWithProgress } from './../components/ButtonViews';
import DragToSave from './../components/DragToSave';
import { UploadByDragAndSave } from './../components/CubeTableFileUpload';


import {
	trivialProps,
	trivialString,	
} from './../model/utils'

import {
	useNftvieWstyles,
} from './AppStoryboardFragments';

 import {
      urlToFileExtension
    , toTokenContentKind
} from './../model/core'


import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { TicketHolderTitle } from './AppStoryboardRare';


/******************************************************
	@View exported
******************************************************/


/**
 *
 * @Use: one app storyboard pannel
 *
**/
export default function AppStoryProfile(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		// base data
		update,
		storyboard,
		userid,
		style,
		job_cache,

		// snack
		tellUser,
		showlinearprogress,
		eshowlinearprogress,
		did_upload_trailer,

	} = props;

	/******************************************************/
    // mount

    // basic about 
    const [ is_owner, eis_owner ]   = useState(false) ;
    const [ name,  ename  ]         = useState("");
    const [ about, eabout ]         = useState("");
    const [ discord, ediscord ]     = useState("");
    const [ instagram, einstagram ] = useState("");
    const [ website, ewebsite ]     = useState("");
    const [ twitter  , etwitter   ] = useState("");

    // files
    const [ trailerfile, setTrailerFile ] = useState(false);
    const [ posterfile , setposterfile  ] = useState(false);
    const [ logofile   , setLogoFile      ] = useState(false);

    const [ _poster_url , eposter_url ] = useState('');
    const [ _trailer_url, etrailer_url] = useState("");
    const [ _logo_url, _elogo_url ] = useState("")

    function poster_url(){
    	return trivialProps(posterfile, 'type') ? '' : URL.createObjectURL(posterfile)
    }

    function video_url(){
    	return trivialProps(trailerfile, 'type') ? '' : URL.createObjectURL(trailerfile)    	
    }

    function logo_url(){
    	return trivialProps(logofile, 'type') ? '' : URL.createObjectURL(logofile);
    }

    // load data
    useEffect(async () => {

    	if ( trivialProps(storyboard, 'get_hero_image') ){
    		return
    	}

    	let _is_owner = await storyboard.is_owner();
    	let _is_mem   = await storyboard.is_member();
    	eis_owner(_is_owner || _is_mem );

        const { discord, image_url, logo_url, instagram, twitter, website, about } = storyboard.root;

        ediscord  (discord)
        einstagram(instagram)
        etwitter  (twitter)
        eabout    (about ?? "");
        ewebsite  (website);
        ename     (storyboard.get_name());

    	let img = storyboard.get_hero_image();
    	eposter_url(img ?? "");
    	_elogo_url(logo_url);

    	let trailers = storyboard.read_trailer();
    	if ( trailers.length > 0 && !trivialProps(trailers[0], 'trailer_url') ){
	    	etrailer_url(trailers[0]['trailer_url'])
	    }

    },[storyboard,update,userid])


    // @use: save updates
    async function onPressActionButton(){

        eshowlinearprogress(true);

        await job_cache.edit_project({
            storyboard : storyboard,
            projectID  : storyboard.get_id(),
            about      : about    ,
            twitter    : twitter  ,
            instagram  : instagram,
            website    : website  ,
            discord    : discord  ,
            image_file : posterfile,
            logo_file  : logofile,
            then_progress: (str) => {
            	tellUser(str)
            },
            then_saved_basics: async ({ success, message }) => {
            	if ( success ){
	            	tellUser('saved basic info')
	            }
            },
            then_saved_logo: ({ success, message }) => {
            	if ( success ){
	            	tellUser('saved logo')
	            }
            },
			then_saved_poster: ({ success, message }) => {
            	if ( success ){
	            	tellUser('saved poster image')
	            }
			},
            then: async ({ success, message }) => {

            	if ( !trivialProps(trailerfile, 'type') ){

		            await job_cache.upload_trailer({
		                file          : trailerfile,
		                youtube_url   : '',
		                num_whitelist : 1000,
		                storyboard    : storyboard,
		                projectID     : trivialProps(storyboard,'get_id') ? '' : storyboard.get_id(),
		                then_uploading: (str) => { 
		                	tellUser(str) 
		                },
		                then: async ({ success, message, data }) => {
		
			                eshowlinearprogress(false);

		                    if ( !success ){
		                        tellUser(message);
		                    } else {
		                        tellUser('Uploaded!')
		                        await did_upload_trailer();
		                    }
		                }
		            });                 		

            	} else {
	                eshowlinearprogress(false);
	                tellUser(message)                    
	                setTimeout(() => {
	                	tellUser('')
	                },2000)
	            }
            }
        })    	
    }

    // update client side poster file
    async function handleSavePoster(inputs){
    	let { success, file } = parse_file(inputs);
    	if ( success ){
	        setposterfile(file);
	        tellUser("scroll down and press save changes to update the poster")
	    }
    }

    // update client side logo file
    async function handleSaveLogo(inputs){
    	let { success, file } = parse_file(inputs);
    	if ( success ){
	        setLogoFile(file);
	        tellUser("scroll down and press save changes to update the logo")
	    }
    }

    function parse_file(inputs){
        let _fs =  Object.values(inputs).filter(f => {
            return !trivialString(f.type) && !trivialString(f.name)
        })

        let file = _fs[0];
        let url  = URL.createObjectURL(file);   
        let type = toTokenContentKind(file.type);

        if ( type === 'mp4' ){
        	tellUser("please upload a jpg or png")
        	return { success: false, file: {} }
        } else {
        	return { success: true, file: file }
        }
    }

    // update client side trailer file
    async function handleSaveTrailer(file){
        tellUser("scroll down and press save changes to update the video")
    	setTrailerFile(file);
    }

	/******************************************************/
    // render


	return (
		<div className={tclasses.scroll_container_alt} style={{...(style ?? {})}}>

			<Stack direction='column' style={{ marginLeft:'36px', paddingTop: '48px', width:'90%'}}>

	            <AppTextField
	                standard
	                disabled
	                hiddenLabel
	                value = {name}
	                onChange={(e) => {return}}
	                className={classes.row_2}                            
	                inputProps={{style: inputPropsTitleA}}
	                style={{...textFieldStyle, marginBottom:'24px'}}
	            />   

	            <TicketHolderTitle 
	            	title='House Poster' 
	            	container_style={{marginLeft:'0px', cursor: is_owner ? "pointer" : ''}}
	            	show_next_btn = {is_owner}
	            	next_page_label = {"Edit"}
	            	next_page_of_users = {() => {
	            		eposter_url("")
	            		setposterfile(false)
	            	}}
		        />
                <div style = {{marginTop:'-18px', marginBottom:'36px'}}>
                	{
                		trivialString(poster_url()) && trivialString(_poster_url)  && is_owner
                		?
				        <DragToSave handleDrop={handleSavePoster}>
				        	<div style={{width:'90%',height:'300px', background:COLORS.black}}>
								<CenterVerticalView style={{height:'100%'}}>
					        		<CenterHorizontalView>
					        		<div className={tclasses.feature_box_child_h1} style={{color: COLORS.surface3}}>
						        		{'Drag and drop poster image here'}
					        		</div>
				        		</CenterHorizontalView>
								</CenterVerticalView>
				        	</div>
				        </DragToSave>
				        :
		                <AppImageView 
		                    imgSrc      = {trivialString(poster_url()) ? _poster_url : poster_url()}
		                    preview_url = {trivialString(poster_url()) ? _poster_url : poster_url()}
		                    width       = {'95%'}
		                    height      = {'300px'}
		                    type        = { trivialString(poster_url()) ? urlToFileExtension(_poster_url) :  urlToFileExtension(poster_url()) }
		                />
		            }	
                </div>

                {
                	true
                	?
                	<div/>
                	:
                	<div>
		            <div onClick={() => {
	            		if ( is_owner ){
		                	_elogo_url(""); 
		                	setLogoFile(false) 
	            		} 
		            }}>
			            <TicketHolderTitle 
			            	title='House Logo' 
			            	container_style={{marginLeft:'0px', cursor: is_owner ? "pointer" : ''}}
				        />
			        </div>
	                <div style = {{marginTop:'-18px', marginBottom:'36px'}}>
	                	{
	                		trivialString(logo_url()) && trivialString(_logo_url)  && is_owner
	                		?
					        <DragToSave handleDrop={handleSaveLogo}>
					        	<div style={{width:'90%',height:'200px', background:COLORS.black}}>
									<CenterVerticalView style={{height:'100%'}}>
						        		<CenterHorizontalView>
						        		<div className={tclasses.feature_box_child_h1} style={{color: COLORS.surface3}}>
							        		{'Drag and drop logo image here'}
						        		</div>
					        		</CenterHorizontalView>
									</CenterVerticalView>
					        	</div>
					        </DragToSave>
					        :
			                <AppImageView 
			                    imgSrc      = {trivialString(logo_url()) ? _logo_url : logo_url()}
			                    preview_url = {trivialString(logo_url()) ? _logo_url : logo_url()}
			                    width       = {'95%'}
			                    height      = {'300px'}
			                    type        = { trivialString(logo_url()) ? urlToFileExtension(_logo_url) :  urlToFileExtension(logo_url()) }
			                />
			            }	
	                </div>                
	                </div>                
	            }

                {
                	false 
                	? 
                	<div/>
                	:
                	<div>
				        <TicketHolderTitle
			            	title='Trailer'
			            	container_style={{marginLeft:'0px', cursor: is_owner ? "pointer" : ''}}
			            	show_next_btn = {is_owner}
			            	next_page_label = {"Edit"}
			            	next_page_of_users = {() => {
			                	etrailer_url(""); 
			                	setTrailerFile(false)
			            	}}
			            />
		                <div style = {{marginTop:'-18px', marginBottom:'36px'}}>
				        	{  trivialString(_trailer_url) && trivialProps(trailerfile, 'type') && is_owner
				        		?
						        <UploadByDragAndSave custom_children handle_did_drop={handleSaveTrailer} >
						        	<div style={{width:'90%',height:'300px', background:COLORS.black}}>
										<CenterVerticalView style={{height:'100%'}}>
							        		<CenterHorizontalView>
							        		<div className={tclasses.feature_box_child_h1} style={{color: COLORS.surface3}}>
							        		{'Drag and drop .mp4 file here'}
							        		</div>
						        		</CenterHorizontalView>
										</CenterVerticalView>
						        	</div>
						        </UploadByDragAndSave>
						        :
				                <AppImageView 
				                    width       = {'90%'}
				                    videoSrc    = {trivialString(video_url()) ? _trailer_url : video_url()}
				                    preview_url = {trivialString(video_url()) ? _trailer_url : video_url()}
				                    type        = {"mp4"}
						        />
		                	}
		                </div>
		            </div>
	           }

	            <TicketHolderTitle 
	            	title='Social Media'
	            	container_style={{marginLeft:'0px', marginTop:'24px'}}
		        />
	            <Stack direction='row' style={{marginTop:'-24px'}}>
		            <AppTextField
		                standard
		                hiddenLabel
		                label='discord'
		                value = {discord}
		                disabled = {!is_owner}
		                onChange={(e) => { ediscord(e.target.value ?? "") }}
		                className={classes.row_2}                            
		                inputProps={{style: inputPropsLink}}
		                style={{...textFieldStyle, width: '35%'}}
		            />            
			        <div style={{width:'48px'}}/>
		            <AppTextField
		                standard
		                hiddenLabel
		                label='website'
		                value = {website}
		                disabled = {!is_owner}
		                onChange={(e) => { ewebsite(e.target.value ?? "") }}
		                className={classes.row_2}                            
		                inputProps={{style: inputPropsLink}}
		                style={{...textFieldStyle, width: '35%'}}
		            />       
			        <Box sx={{ flexGrow: 1 }} />
		        </Stack>

	            <Stack direction='row' style={{marginTop:'-36px', marginBottom:'12px'}}>
		            <AppTextField	            
		                standard
		                hiddenLabel
		                label='instagram'
		                value = {instagram}
		                disabled = {!is_owner}		                
		                onChange={(e) => { einstagram(e.target.value ?? "") }}
		                className={classes.row_2}                            
		                inputProps={{style: inputPropsLink}}
		                style={{...textFieldStyle, width: '35%'}}
		            />    
			        <div style={{width:'48px'}}/>
		            <AppTextField
		                standard
		                hiddenLabel
		                label='twitter'
		                value = {twitter}
		                disabled = {!is_owner}
		                onChange={(e) => { etwitter(e.target.value ?? "") }}
		                className={classes.row_2}                            
		                inputProps={{style: inputPropsLink}}
		                style={{...textFieldStyle, width: '35%'}}
		            />      
			        <Box sx={{ flexGrow: 1 }} />		            
		        </Stack>

	            <TicketHolderTitle 
	            	title='About'
	            	container_style={{marginLeft:'0px', marginTop:'0px'}}
		        />
                <div style = {{marginTop:'-46px', marginBottom:'36px'}}>
		            <AboutAttributeSimple
			            autoFocus
			            disabled = {!is_owner}
		                numLines = {20}
		                value    = {about}
		                onChange = {e => { eabout(e.target.value ?? "") }}
		                style    = {
		                	is_owner 
		                	?
		                	{width:'90%', marginTop:'28px', marginLeft:'-4px', height:'fit-content', borderRadius:'0px'}
		                	:
		                	{width:'90%', marginTop:'28px', marginLeft: '-12px', height:'fit-content', background: COLORS.surface }
		                }
		            />                
	            </div>		        

		        {is_owner 
		        	?
		            <Stack direction='row' style={{width: isOnMobile ? '100%' : '90%', marginBottom:'24px'}}>
		                <ActionProgressWithProgress
		                    showProgress={showlinearprogress}
		                    onClick = {onPressActionButton}
		                    label={'Save changes'}
		                />                
	                </Stack>
	                :
	                <div/>
	            }             

	        </Stack>

		</div>

	)


}



const textFieldStyle = {
	width: '90%',
	marginTop: '36px',
	marginBottom: '54px'
}

const inputPropsTitleA = {
    fontSize: `5vh`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    marginTop: '-32px',
}

const inputPropsTitle = {
    fontSize: `3vh`,
    fontFamily: 'NeueMachina-Bold',    
    color     : COLORS.text2,
    marginTop: '-32px',
}

const inputPropsLink = {
    fontSize: `1.8vh`,
    fontFamily: 'NeueMachina-Light',    
    color     : COLORS.text,
}



