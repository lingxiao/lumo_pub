/**
 * @Package: ChatTextInput.jsx
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - chat style: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/App.js
 *   - chat full: https://github.com/Wolox/react-chat-widget
 *   - the console referenced: https://github.com/linuswillner/react-console-emulator
 *   - other console: https://github.com/webscopeio/react-console
 *   - mui lib: https://mui.com/components/text-fields/
 *   - color: https://newbedev.com/material-ui-input-component-underline-color
 *   - fat caret: https://stackoverflow.com/questions/38095446/how-to-make-custom-caret
 *
*/

 
import React, {Component} from 'react'
import TextField from '@material-ui/core/TextField';
import { createStyles, makeStyles, withStyles } from "@material-ui/core/styles";
import { COLORS } from './constants';


/******************************************************
    @styles
******************************************************/


const useStyles = makeStyles((theme) => createStyles({
    wrapForm : {
        display: "flex",
        justifyContent: "center",
        margin: `${theme.spacing(0)} auto`,
        overflowY: 'scroll'
        // background: COLORS.offBlack
    },

    inputFont:{
        color:'white',
        // filter: `brightness(0.7) invert(0.25)  blur(0.4px)`,
        padding: theme.spacing(1),
        fontFamily: 'NeueMachina-Bold',
        fontSize: '14px',                               
        // borderBottom: `0.8px solid ${COLORS.translucent}`,        
    },

}));


const AppTextField = withStyles({
    root: {
        // '& .MuiInputBase-input': {
        //   color: '#fff', // Text color
        // },
        '& .MuiInput-underline:before': {
          borderBottomColor: COLORS.translucent, 
        },
        '& .MuiInput-underline:hover:before': {
          borderBottomColor: COLORS.translucent2, 
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: COLORS.translucent3, 
        },
        "& .MuiFormLabel-root": {
          color: COLORS.text3,
          fontFamily: 'NeueMachina-regular',
        }        
    },
})(TextField);

const AppTextFieldDarkUnderline = withStyles({
    root: {
        // '& .MuiInputBase-input': {
        //   color: '#fff', // Text color
        // },
        '& .MuiInput-underline:before': {
          borderBottom: `1.5px solid ${COLORS.black}`
        },
        '& .MuiInput-underline:hover:before': {
          borderBottom: `1.5px solid ${COLORS.black}`
        },
        '& .MuiInput-underline:after': {
          borderBottom: `1.5px solid ${COLORS.black}`
        },
    },
})(TextField);

const AppTextFieldWhiteUnderline = withStyles({
    root: {
        // '& .MuiInputBase-input': {
        //   color: '#fff', // Text color
        // },
        '& .MuiInput-underline:before': {
          borderBottom: `0.5px solid ${COLORS.text}`
        },
        '& .MuiInput-underline:hover:before': {
          borderBottom: `0.5px solid ${COLORS.text}`
        },
        '& .MuiInput-underline:after': {
          borderBottom: `0.5px solid ${COLORS.text}`
        },
    },
})(TextField);

const AppTextFieldNoUnderLine = withStyles({
    root: {
        // '& .MuiInputBase-input': {
        //   color: '#fff', // Text color
        // },
        '& .MuiInput-underline:before': {
          borderBottomColor: COLORS.transparent, 
        },
        '& .MuiInput-underline:hover:before': {
          borderBottomColor: COLORS.transparent, 
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: COLORS.transparent, 
        },
    },
})(TextField);


/******************************************************
    @View
******************************************************/


/**
 *
 * @Use: chat text input view
 *
 * rowMax = 3
 **/
const TextInputView = (props) => {

    const classes = useStyles();
    const { handleChange, onKeyPress, textValue } = props;

    return (
        <form className={classes.wrapForm}  noValidate autoComplete="off">
            <AppTextField 
                fullWidth 
                multiline
                autoFocus
                rows   = "1"
                variant="standard"
                margin = "normal"
                value  = {textValue}
                onChange={handleChange}
                onKeyPress = {onKeyPress}
                className = {classes.wrapForm}
                InputProps={{className: classes.inputFont, disableUnderline: false}}
            />
        </form>

    )
}


/**
 *
 * @use: text input view with custom behaivor
 *       where on enter, the textinput value
 *       bubbles up to parent
 *
 **/
export default class ChatTextInput extends Component {

    state = {
        inputed_text: "",
        just_pressed_enter: false,
    }

    /**
     *
     * @Use: get user input value and save as state
     *
     **/
    did_put_chat = (e) => {

        const str = e.target.value ?? "";
        const { just_pressed_enter, inputed_text } = this.state;

        if (just_pressed_enter){

            let tail = str.substring(inputed_text.length, str.length);
            this.setState({ inputed_text: tail, just_pressed_enter: false })

        } else {

            this.setState({  inputed_text: str, just_pressed_enter: false });

        }
    }
    /**
     *
     * @Use: parse chat, either call command
     *       or put chat into db
     *
     **/
    did_press_key = async (e) => {

        if (  e.key === 'Enter' ){

            const { didPressEnter } = this.props;
            const { inputed_text } = this.state;
            this.setState({ just_pressed_enter: true })

            if ( didPressEnter !== null ){
                let should_clear = didPressEnter(inputed_text);
                if (should_clear){
                    this.setState({ inputed_text: "" })
                }
            }
        }
    }

    render(){
        return (
            <TextInputView 
                {...this.props} 
                textValue    = {this.state.inputed_text}
                onKeyPress   = {this.did_press_key}
                handleChange = {this.did_put_chat}
            />
        )        
    }
}


export { AppTextField, AppTextFieldNoUnderLine, AppTextFieldWhiteUnderline, AppTextFieldDarkUnderline }













