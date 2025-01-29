/**
 * @Package: AppSnackbar.jsx
 * @Date   : 1/3/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React from "react";
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { COLORS } from './constants';

const snackBarStyle = {
    fontSize: '16px',        
    color: COLORS.text,
    // textShadow:`var(--red-glow)` ,
    fontFamily: 'NeueMachina-Medium',
    background: COLORS.surface2,
    marginBottom: '50px',
    maxWidth: '30vw',
}



export default function AppSnackbar(props) {

    const { vertical, horizontal, showSnack, snackMessage } = props;
    
    return (
        <Snackbar
            anchorOrigin={{ vertical: vertical, horizontal:horizontal }}
            open={showSnack && snackMessage !== ""}
            onClose={() => {return}}
            key={'snack'}
        >            
          <SnackbarContent 
            style={snackBarStyle}
            message={<span id="client-snackbar"> {snackMessage ?? ""} </span>}
          />            
        </Snackbar>
    )


}




