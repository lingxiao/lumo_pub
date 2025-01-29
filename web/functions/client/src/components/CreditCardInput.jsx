/**
 *
 * @Package: Credit card input
 * @Date   : Dec 25th, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - button: https://mui.com/api/button/
 *
*/


import React, {useState} from 'react'
import { Paper } from "@material-ui/core";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';


import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { COLORS } from './constants'
import burn_img from './../assets/burn1.jpeg';

/******************************************************
    @View: exported
******************************************************/

const useStyles = (isOnMobile) =>  makeStyles((theme) => createStyles({

    paper: {
        padding: theme.spacing(5),
        display: "flex",
        // alignItems: "center",
        // flexDirection: "column",
        // position: "relative",
        // borderRadius: '30px',
        textAlign: 'left',                      
        // background: `-webkit-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9))`,
        // background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0,0,0,0.9))`,                
        backgroundImage: `url(${burn_img})`,                
    },

 
    mintButton :{
        height: '50px',
        padding: theme.spacing(4),
    },

    moreInfoBtn : {
        height: '40px',
        display: 'flex',
        textAlign: 'left',
        border: `2px ${COLORS.translucent2}`
    },

    grad_back: {
        // width: '100%',
        // display: 'flex'
        // background: `-webkit-linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9))`,
        // background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0,0,0,0.9))`,        
    },

    buttonPadding : {
        paddingTop: theme.spacing(3)
    },

    inputProps: {
        filter: `brightness(0.7) invert(0.25)  blur(0.4px)`,
        fontFamily: 'NeueMachina-Medium',      
        fontSize: '13px',                               
    },

    prompt : {
        fontFamily: 'NeueMachina-Regular',
        fontSize: `15px`,
        textAlign: 'left',              
        color: 'white',
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },


}));

/**
 *
 * @Use: credit card input
 * @Doc: https://mui.com/components/text-fields/
 * @Doc: https://mui.com/components/transitions/
 * 
**/
export default function CreditCardInput(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)() 

    const [checked, setChecked] = React.useState(false);

    const { onConfirm } = props;

    const handleChange = () => {
        setChecked((prev) => true);
        onConfirm();
    };

    return (
        <Fade in={!checked}>
            <Paper className={classes.paper} >
                <Box
                    component="form"
                    noValidate
                    autoComplete="off"
                    sx={{ input: { color: COLORS.offwhite } }}
                >
                  <div>
                    <TextField
                        error
                        id="outlined-error"
                        label="Error"
                        defaultValue="Hello World"
                        className={classes.grad_back}
                    />
                    <TextField
                        error
                        id="outlined-error-helper-text"
                        label="Error"
                        defaultValue="Hello World"
                        helperText="Incorrect entry."
                        className={classes.grad_back}                
                    />
                  </div>
                  <div>
                    <TextField
                        error
                        id="filled-error"
                        label="Error"
                        defaultValue="Hello World"
                        variant="filled"
                        className={classes.grad_back}                
                    />
                    <TextField
                        error
                        id="filled-error-helper-text"
                        label="Error"
                        defaultValue="Hello World"
                        helperText="Incorrect entry."
                        variant="filled"
                    />
                  </div>
                  <div>
                    <TextField
                        error
                        id="standard-error"
                        label="Error"
                        defaultValue="Hello World"
                        variant="standard"
                        className={classes.grad_back}                
                    />
                    <TextField
                        error
                        id="standard-error-helper-text"
                        label="Error"
                        defaultValue="Hello World"
                        helperText="Incorrect entry."
                        variant="standard"
                    />
                  </div>

                    <Box sx={{ flexGrow: 1 }}>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            className={classes.mintButton} 
                            sx={ { borderRadius: 30 } }
                            onClick = {handleChange}
                        >
                            Confirm
                        </Button>                  
                    </Box>
                </Box>
            </Paper>
        </Fade>
    );
}


const inputProps = {
    fontFamily: 'NeueMachina-Bold',              
    fontSize: '15px',                               
    color: 'black',
}
/**
 *
 * @Use: credit card input
 * @Doc: https://mui.com/components/text-fields/
 * @Doc: https://mui.com/components/transitions/
 * 
 **/
export function SubmitTokenInput(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)() 
    const { notConnected, submit } = props;

    const [address, changeAddress] = useState("")
    const [tokID, changeTokID] = useState("")

    function goSubmit(){
        if (submit !== null && submit !== undefined){
            submit({ address: address, tokID: tokID })
        }
    }

    return (
        <Paper className={classes.paper} >
            <Box
                component="form"
                autoComplete="off"
                sx={{ input: { color: COLORS.offwhite } }}
            >        
            <Stack
                component="form"
                sx={{width: '100%'}}
                spacing={1}
                noValidate
                autoComplete="off"
            >
                <div className={classes.prompt}>
                { notConnected 
                    ? "Please connect to Metamask first"
                    : "Please Input your token information from Opensea"
                }
                </div>

                { notConnected ? <></> :
                    <>
                        <TextField                        
                            error
                            autoFocus
                            hiddenLabel
                            id="filled-hidden-label-small"
                            variant="standard"
                            label="Contract Address"
                            size="small"
                            className={classes.grad_back}
                            inputProps={{style: inputProps}}
                            value={address}
                            onChange={e => { changeAddress(e.target.value ?? "")}}                                                        
                        />
                        <TextField
                            error
                            hiddenLabel
                            id="filled-hidden-label-normal"
                            variant="standard"
                            label="Token ID"
                            className={classes.grad_back}                            
                            inputProps={{style: inputProps}}
                            value={tokID}
                            onChange={e => { changeTokID(e.target.value ?? "")}}                                                        
                        />
                    </>
                }
                <Button 
                    variant="outlined" 
                    color="error" 
                    outlined = {false}
                    className={classes.moreInfoBtn} 
                    onClick = {goSubmit}
                    style={{paddingTop:'10px'}}
                >
                    <div className={classes.prompt} style={{fontFamily: 'NeueMachina-Black', fontSize: '25px', color: COLORS.translucent3}}>
                        { notConnected ? "Connect to Metamask" : "Set as Avatar" }
                    </div>                
                </Button>
            </Stack>
            </Box>
        </Paper>
    );
}








