/**
 * @Package: ButtonViews
 * @Date   : Dec 27th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { useStyles as useProfileStyles } from './../dialogs/DialogUtils';
import { COLORS } from './constants';	
import BlinkingDots from './BlinkingDots'
import WithChangeOpacity from './WithChangeOpacity';


import { alpha, styled } from '@mui/material/styles';
import { pink } from '@mui/material/colors';
import Switch from '@mui/material/Switch';



/******************************************************
	@styles
******************************************************/

const mobile_R = 70;
const desktop_R = 32;


const useStyles = (isOnMobile) => makeStyles((theme) => createStyles({

    mintButton :{
        height: '50px',
        width : isOnMobile ? `${mobile_R/3-3}vw` : `${desktop_R/3-3}vw`,
    },

    wrappedToken: {
        width : isOnMobile ? '50vw' : '20vw',
        height: isOnMobile ? '50vw' : '20vw',
        position: 'absolute',
    },

}));



/******************************************************
	@Big acton button
******************************************************/

/**
 *
 * @use: button in dark mode
 * @Doc https://mui.com/material-ui/react-button/
 *
*/
const DarkButtonView = styled(Button)({
  boxShadow: 'none',
  textTransform: 'none',
  // fontSize: 13,
  // padding: '6px 12px',
  border: '1px solid',
  // lineHeight: 1.5,
  color: COLORS.text3,
  backgroundColor: COLORS.black,
  borderColor:  COLORS.surface3,
  fontFamily: [
	  'NeueMachina-Medium',
  //   '-apple-system',
  //   'BlinkMacSystemFont',
  //   '"Segoe UI"',
  //   'Roboto',
  //   '"Helvetica Neue"',
  //   'Arial',
  //   'sans-serif',
  //   '"Apple Color Emoji"',
  //   '"Segoe UI Emoji"',
  //   '"Segoe UI Symbol"',
  ].join(','),
  '&:hover': {
    backgroundColor: COLORS.offBlack,// '#0069d9',
    borderColor: COLORS.surface,// '#0062cc',
    boxShadow: 'none',
  },
  '&:active': {
    boxShadow: 'none',
    backgroundColor: COLORS.surface3,// '#0062cc',
    borderColor: COLORS.surface2,// '#005cbf',
  },
  '&:focus': {
    boxShadow: COLORS.surface, // '0 0 0 0.2rem rgba(0,123,255,.5)',
  },
  '&:disabled' : {
    color: COLORS.text3,
    opacity: 0.5,
    backgroundColor: "transparent",
    boxShadow: COLORS.surface, // '0 0 0 0.2rem rgba(0,123,255,.5)',

  }
});


function DarkButton(props){

    const { showProgress, sx } = props;

    if (  showProgress ){

        return <DarkButtonView {...props} disabled/>

    } else {

        return <DarkButtonView {...props}/>
    }
}

/*
const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: purple[500],
  '&:hover': {
    backgroundColor: purple[700],
  },
}));

export default function CustomizedButtons() {
  return (
    <Stack spacing={2} direction="row">
      <ColorButton variant="contained">Custom CSS</ColorButton>
      <BootstrapButton variant="contained" disableRipple>
        Bootstrap
      </BootstrapButton>
    </Stack>
  );
}*/

/******************************************************
	@Big acton button
******************************************************/



/**
 *
 * @Use: progress button for modal with progress
 * 
 *
*/
function ActionProgressWithProgress(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useProfileStyles(isOnMobile, true, false)();    

    const { 
        showProgress,   
        progress_text,    
        inactive,      
        onClick,    
        label, 
        sx,     
        subtext,    
        onClickSubtext,
        btn_text_style, 
    } = props;

    var diabled_sx = {
    	color: COLORS.surface3,
    	borderColor: COLORS.surface3    	
    }

    var sx_style ={  
    	borderRadius: '30px', 
    	...(sx ?? {}),
    	...(inactive ? diabled_sx : {})
    }
    const subtitle_style = { 
        color: COLORS.text3, 
        // opacity: '0.75', 
        marginTop:'12px', 
        fontFamily: 'NeueMachina-Medium', 
        fontSize:'14px' 
    }

	if ( showProgress ){
		return (
            <div className = {classes.row_5_btn}>
                <Stack direction="row" alignItems="center">                
                    <div className={classes.change_avatar_btn_font} style={{color:COLORS.text3, fontFamily: 'NeueMachina-Bold', fontSize:'18px'}}>
                        {(progress_text ?? `Saving`).toLowerCase()}
                        <BlinkingDots/>
                    </div>
                </Stack>
            </div>  
        )             
	} else {
		return (
            <div className = {classes.row_5_btn}>
                <Stack direction="column" alignItems="center">
                    <Button 
                        variant="outlined" 
                        color="error" 
                        sx={ {...(sx_style), height: 'fit-content' }}
                        onClick = {onClick}
                        className={classes.change_avatar_btn}
                    >   
                        <div className={classes.change_avatar_btn_font} style={{ fontSize: isOnMobile ? "18px" : 'calc(8px+1.2vw)', ...(btn_text_style ?? {})}}>
                            {(label ?? "").toUpperCase()}
                        </div>
                    </Button>           
                    	{ typeof onClickSubtext === 'function'
    	                	?
    		               <WithChangeOpacity onClick={onClickSubtext}>
    			                <div style={subtitle_style}>
    			                	{(subtext ?? "")}
    			                </div>
    		               </WithChangeOpacity>
    		               :
    		                <div style={subtitle_style}>
    		                	{(subtext ?? "")}
    		                </div>		               
    	                }
                </Stack>
            </div>  
        )    
    }

}


const GreenSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: pink[600],
    '&:hover': {
      backgroundColor: alpha(pink[600], theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: pink[600],
  },
}));

function ColorSwitches() {
	const label = { inputProps: { 'aria-label': 'Switch demo' } };
	return (
		<div>
			<GreenSwitch {...label} defaultChecked />
		</div>
	);
}

export { DarkButton, ColorSwitches, ActionProgressWithProgress  }




