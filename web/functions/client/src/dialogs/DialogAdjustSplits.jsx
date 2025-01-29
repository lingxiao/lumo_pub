/** *
 * @Package: DialogAdjustSplits 
 * @Date   : 8/9/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import { CenterHorizontalView } from './../components/UtilViews'

import DialogParent from './DialogUtils';
import { COLORS } from './../components/constants';
import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import SplitTable from './../pages/SplitTable';
import { AppTextFieldNoUnderLine } from './../components/ChatTextInput'

/******************************************************
    @style
******************************************************/

const inputPropsTitle = {
    fontSize: `3vh`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    marginTop: '-32px',
    cursor: 'pointer'
}


/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogAdjustSplits(props) {

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        snackMessage, 
        showSnack, 
        storyboard,
        showlinearprogress,
        eshowlinearprogress,
    } = props;
        
    // basics
    const [ title, etitle ] = useState("Share Invite Link")


    /******************************************************/
    // responders

    function goHandleClose(){
        handleClose();
        tellUser("");
    }

    function didChangeSplits(){
        setTimeout(() => {
            goHandleClose();
        },4000);
    }

    /******************************************************/
    // view

    // propagate snack msg mode thru
    const [ snack, setSnack ] = useState({ show: false, str: "" })
    useEffect(() => {
        setSnack({
            show: true,
            str : snackMessage ?? ""
        })
    }, [showSnack, snackMessage])

    function tellUser(str){
        setSnack({ show: true, str: str })
        setTimeout(() => {
            if ( snack.str === str ){
                setSnack({ show: false, str: "" })
            }
        },3000)
    }

    return (
        <DialogParent 
            {...props}        
            fullWidth
            open={open}
            onClose={goHandleClose}
            snack={snack}
            maxWidth={'wd'}
            title={'Adjust Splits'}
            footer_top={'Adjust the splits on your contract'}
            footer_left={''}
        >
            <div style={{
                width:'100%', marginTop:'24px', marginBottom:'24px', marginLeft:'12px', marginRight:'12px'
            }}>
                { true ? <div/> :
                <CenterHorizontalView>
                    <AppTextFieldNoUnderLine
                        standard
                        disabled
                        hiddenLabel
                        value = {`Adjust Your Splits`.toUpperCase()}
                        onChange={(e) => {return}}
                        inputProps={{style: inputPropsTitleA}}
                        style={{marginBottom:'12px', marginTop:'12px'}}
                    />   
                </CenterHorizontalView>
                }
                <CenterHorizontalView style={{marginLeft:'-6vw', background:'transparent', }}>
                    <SplitTable 
                        {...props} 
                        showProgress={showlinearprogress}
                        eshowProgress={eshowlinearprogress}                                   
                        storyboard={storyboard} 
                        didChangeSplits={didChangeSplits}
                        tellUser={tellUser}
                    />                    
                </CenterHorizontalView>                                       
            </div>
        </DialogParent>

    )

}


/******************************************************
    @style + export
******************************************************/


const inputPropsTitleA = {
    fontSize: `5vw`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    marginTop: '0px',
}


export default withAuth(withRouter(DialogAdjustSplits))






