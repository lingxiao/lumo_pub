/**
 *
 *
 * @Package: SaleMenuView
 * @Date   : May 22nd, 2021
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useEffect, useState} from "react";

import Stack from '@mui/material/Stack';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import WithChangeOpacity from './WithChangeOpacity';
import { COLORS } from './constants';
import useCheckMobileScreen, {useSafari} from './../hoc/useCheckMobileScreen';
import Fade from '@mui/material/Fade';
import { BootstrapTooltip } from './UtilViews';

import AppImageView from './../components/AppImageView'

import {
    trivialProps,
    trivialString,
} from './../model/utils'

import { urlToFileExtension } from './../model/core';


import {isMobile} from 'react-device-detect';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

/******************************************************
    @views exported
******************************************************/


/**
 *
 * @Use: render about rows
 * 
 */
export default function SaleMenuView(props) {

	const isOnMobile = useCheckMobileScreen(1200);
    const classes = useStyles(isOnMobile)();

    const { name, logo, datasource, showlinearprogress, tellUser } = props;
    const [ span_name, set_span_name ] = useState('offset')
    const [ did_load_img, edid_load_img  ] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            set_span_name('animate-done')
        },4500)
    },[]);



    let _name = typeof name === 'string' ? (name ?? "**") : "**"
    let _break = Math.round(Math.random()*10)
    let name_frag_1 = _name.slice(0,_break)
    let name_frag_2 = _name.slice(_break, _break+3)
    let name_frag_3 = _name.slice(_break+3, _name.length)
    var name_frag_mobile = _name.slice(0,20)
    if ( name_frag_mobile.length < name.length ){
        name_frag_mobile = `${name_frag_mobile}..`
    }

    return (
        <Stack direction='column' className={classes.container}>
            {
                trivialString(logo) || true
                ?
        		<div className={classes.title} style={{ maxWidth: isOnMobile ? '100%' : '65%', height:'fit-content', marginBottom: '12px'}}>
                     <div>
                        {name_frag_1}<span id={span_name}>{name_frag_2}</span>{name_frag_3}
                    </div>
        		</div>
                :
                <div style={{background:'transparent', width: isOnMobile ? '90vw':'50vw', height: '150px'}}>
                    <AppImageView   
                        width  = {'50vw'}
                        imageDidLoad = {() => {edid_load_img(true)}}
                        preview_url  = {logo}
                        imgSrc       = {logo}
                        type         = {urlToFileExtension(logo)}
                        imgStyle = {{width: isMobile ? '90vw' : '50vw', height: '120px', marginTop:'10px' }}

                    />                  
                </div>
            }
            <Fade in={!trivialString(name)}>            
        		<Stack className={classes.menu} direction='row'>				
                {   datasource.map((data,index) => (
                        <PillView 
                            {...props} 
                            {...data} 
                            rotat={data.rotate}
                            tip = {trivialProps(data,'tip') ? '' : (data.tip ?? "")}
                            label={data['str'] ?? ""} 
                            index={index}
                            style={ data.rotate ? {transform: 'rotate(7deg)'} : {}}
                            tellUser = {tellUser}
                            disabled={showlinearprogress}
                        />
                    ))
                }
        		</Stack>
            </Fade>
        </Stack>
    );
}



/******************************************************
    @style
******************************************************/

var bg = COLORS.red
var hole = `.4em`

const useStyles = (mobile) => makeStyles((theme) => createStyles({

    container : {
        margin    : theme.spacing(4),
        marginLeft: mobile ? theme.spacing(2) : theme.spacing(8),
        background: 'transparent',
    },

    title : {
        color     : 'white',                
        fontFamily: 'NeueMachina-Black',
        fontSize  : mobile ? '6vh' : `9vh`,
        textAlign : 'left',        
        // textShadow  : `var(--red-glow)`,     
        height: mobile ? '6vh' : '9vh',
        animation: 'text-flicker 3s linear',  // infinite      
        animationDuration: '5.0s',        
    },  

    menu: {
        height: '46px',
        width: '80vw',
    },

    pill : {
        color: COLORS.text2,
        background: COLORS.offBlack,        
        fontFamily: 'NeueMachina-Black',
        fontSize  : `calc(1vw+12px)`,
        textAlign : mobile ? "left" : 'center',           
        padding: theme.spacing(1.5),
        marginRight: '2px',
        cursor: 'pointer',
    },

}));




/******************************************************
    @views componet
******************************************************/


function PillView({ disabled, isTicket,isMemberTok, rotate, label, style, tip, onClick, tellUser }){

    const isOnMobile = useCheckMobileScreen(1200);
    const classes = useStyles(isOnMobile)();

    var pill_font = isMobile ? {fontFamily:'NeueMachina-Medium'} : {}
    if ( disabled ){
        pill_font = {
            ...pill_font,
            color: COLORS.text3,
            background: 'transparent',
            border: `0.1px solid ${COLORS.text3}`,
            opacity: 0.5,
        }
    }

    function _maybeOnClick(label){
        if ( disabled ){
            tellUser("Slow down there!")
            setTimeout(() => { tellUser("") },3000)
        } else {
            onClick(label);
        }

    }

    if (isMobile && rotate){

        return <div/>

    } else {
        return (
            <WithChangeOpacity onClick={() => { _maybeOnClick(label ?? "") }}>
                <BootstrapTooltip title={tip ?? ""}>
                    {

                        isTicket
                        ?
                        <div className = {classes.pill} style={{ borderRadius: '10px', ...pill_font }}>
                            <Stack direction='horizontal' style={{height:'100%'}}>
                                <ConfirmationNumberIcon style={{ color: COLORS.text2, marginRight:'8px', marginTop:'-6px'}}/>
                                {label ?? ""}
                            </Stack>
                        </div>     
                        :
                        isMemberTok
                        ?
                        <div className = {classes.pill} style={{ borderRadius: '10px', ...pill_font }}>
                            <Stack direction='horizontal' style={{height:'100%'}}>
                                <QrCodeScannerIcon style={{ color: disabled ? COLORS.text3 : COLORS.text2, marginRight:'8px', marginTop:'-6px'}}/>
                                {label ?? ""}
                            </Stack>
                        </div>     
                        :
                        <div className = {classes.pill} style={{ ...(style ?? {}), ...pill_font}}>
                            {label ?? ""}
                        </div>     
                    }
                </BootstrapTooltip>
            </WithChangeOpacity>
        )
    }   
}





