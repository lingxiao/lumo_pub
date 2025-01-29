/**
 * @Package: UtilViews
 * @Date   : May 30th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { COLORS } from './constants';	
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import WithChangeOpacity from './WithChangeOpacity';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { useStyles as useProfileStyles } from './../dialogs/DialogUtils';


import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { AppTextField } from './ChatTextInput'

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}));

const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.black,
    fontSize: '14px',
    fontFamily: 'NeueMachina-Medium',
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    fontSize: '14px',
    fontFamily: 'NeueMachina-Medium',
    padding: '12px',
    letterSpacing: '0.5px',
    lineHeight: '1.2em',    
    color: COLORS.text3
  },
}));

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));



export function CenterHorizontalView({ style, children }){
    return (
        <Stack direction='row' style={{ width: '100%', ...(style ?? {}), }}>
            <Box sx={{flex:1}}/>
            {children}
            <Box sx={{flex:1}}/>
        </Stack>
    )
}

export function CenterVerticalView({ style, children }){
    return (
        <Stack direction='column' style={{ ...(style ?? {}), }}>
            <Box sx={{flex:1}}/>
            {children}
            <Box sx={{flex:1}}/>
        </Stack>
    )
}


const inputPropsLink = {
    fontSize: `2vh`,
    fontFamily: 'NeueMachina-Light',    
    color     : COLORS.text,
}

const label_font = {
    fontSize: '12px',
    fontFamily: 'NeueMachina-Bold',
    color: COLORS.text3,
}

/******************************************************
    @texfield
******************************************************/

/**
 *
 * @use: one item field 
 *
*/
function HeaderAndAboutField({ style, textFieldStyle, numLines, hideHeader, label, value, evalue, on_click, hideCheckMark, label_width }){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useProfileStyles(isOnMobile, true, false)();    

    const parent_style = {
        width: '90%',
        ...(style ?? {}),
    }

    return (
        <CenterHorizontalView>
            <Stack direction='column' style={parent_style}>
                <Stack direction='row'>
                    { hideHeader ? <div/> :
                     <AppTextField
                        standard
                        hiddenLabel
                        disabled
                        value = {label}
                        onChange={() => {}}
                        className={classes.row_2}                            
                        inputProps={{style: inputPropsLink}}
                        style={{width: label_width ? label_width : '57%'}}
                    />            
                    }
                    { hideCheckMark || hideHeader 
                        ? 
                        <div/> 
                        :
                       <WithChangeOpacity onClick={on_click}>
                            <Stack direction={'row'} style={{width:'fit-content',marginTop:'56px', marginLeft: '150px',}}>
                            { value.done 
                                ?
                                <CheckBoxIcon style={{ color: COLORS.text2, marginRight:'8px'}}/>
                                :
                                <CheckBoxOutlineBlankIcon style={{ color: COLORS.text2, marginRight:'8px'}}/>
                            }
                            <div style={{...label_font, marginTop:'6px'}}>
                                {'Completed'}
                            </div>
                            </Stack>
                        </WithChangeOpacity>       
                    }
                </Stack>
                <AboutAttributeSimple
                    numLines = {numLines ?? 10}
                    value    = {value.about}
                    onChange = {e => { evalue(e.target.value ?? "") }}
                    style    = {{width:'95%',marginTop:'-120px', ...(textFieldStyle ?? {}) }}
                />            
            </Stack>
        </CenterHorizontalView>
    )    
}



/******************************************************
    @view: exported
******************************************************/


export {
    LightTooltip,
    BootstrapTooltip,
    HtmlTooltip,
    HeaderAndAboutField,
}