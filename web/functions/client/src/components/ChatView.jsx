/**
 * @Package: ChatView.jsx
 * @Date   : Dec 29th, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - chat style: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/App.js
 *   - chat full: https://github.com/Wolox/react-chat-widget
 *   - the console used: https://github.com/linuswillner/react-console-emulator
 *   - other console: https://github.com/webscopeio/react-console
 *	 - performant scrolling: https://www.npmjs.com/package/react-infinite-scroll-component
 *   - example scroll: https://codesandbox.io/s/yk7637p62z?file=/src/index.js
 *   - ref item in listview: https://pretagteam.com/question/how-to-set-ref-in-list-of-items-react-js
 *   - scrollIntoView w/o scrolling page: https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move
 *
*/


import React, {useEffect, useState, createRef} from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import LinearProgress from '@mui/material/LinearProgress';
import InfiniteScroll from 'react-infinite-scroll-component';

import ChatTextInput from "./ChatTextInput";
import AppSnackbar   from './AppSnackbar';
import { MessageLeft, MessageRight } from "./ChatMessage";

import punk              from './../assets/cube2.png'
import lumo_red          from './../assets/lumored.jpeg'
import { trivialString } from './../model/utils'  
// import { app_header_footer_ht } from './AppBodyTemplate';

import { urlToFileExtension } from './../model/core';
import { BoardHeader, row_1 } from './MoodBoardView'



/******************************************************
	@style
******************************************************/

const row_chat = 4
const app_header_footer_ht = '200px'


const useStyles = makeStyles((theme) => createStyles({

    container: {
        width: '40vw',
        height: `calc(100vh - ${app_header_footer_ht})`,
        position: 'relative',
        padding: theme.spacing(3), 
    },

    textInputContainer :{
        width: '40vw',
        height: `${row_chat}vh`,
        position: 'absolute',
        bottom: 0,
        // background: 'purple'
    },

    blank : {
        paddingTop: theme.spacing(4),
    },

}));

const refDivStyle = {
    width: '10px',
    height: '10px',
    marginTop: '70px',
    // background: 'red',
}

const chat_container_style = {
    width: '40vw',
    height: `calc(100vh - ${app_header_footer_ht} - ${row_chat}vh - ${row_1}vh)`,    
}



/******************************************************
	@views
******************************************************/


// blank message
const BLANK = "_____";



/**
 *
 * @Use select theappropriate chat bubble
 *
 **/
function BubbleView(props){

    const {
        item,
        isAuthed,
        handleTapIcon,
        adminUserID, 
        handleClickImage,
        onTapAuthedUserIcon,
    } = props;
    const classes = useStyles();

    let preview_url = 
        item['openSea_image_preview_url'] 
        || item['openSea_image_thumbnail_url']
        || item['openSea_image_url'] 
        || item['collab_preview_url']

    let preview_type = urlToFileExtension(preview_url);

    function onClickImage(){
        if (typeof handleClickImage === 'function'){
            handleClickImage(item)
        }
    }

    function onTapIcon(){
        if (typeof handleTapIcon === 'function'){
            handleTapIcon(item)
        }
    }

    if ( item === BLANK ){

        return (
            <div className={classes.blank}/>
        )

    } else if (item.isAdminMessage){

        return (
            <MessageLeft
                avatarDisp
                isBlurred = {false}
                message   = {item.message}
                timestamp = "MM/DD 00:00"
                photoURL  = {lumo_red}
                displayName={"Lumo"}
                preview_url = {preview_url} 
                item        = {item}
                kind        = {item.kind}
                handleClickImage = {onClickImage}               
                handleTapIcon = {onTapIcon}
                preview_type  = {preview_type}
            />   
        )

    } else if ( item.userID === adminUserID ){

        return (
            <MessageRight
                avatarDisp
                isBlurred = {!isAuthed}
                message={item.message}
                timestamp="MM/DD 00:00"
                photoURL={trivialString(item.avatar) ? punk : item.avatar}
                displayName={item.userID}
                preview_url = {preview_url}
                item        = {item}
                kind        = {item.kind}
                handleClickImage = {onClickImage}             
                handleTapIcon = {onTapAuthedUserIcon}
                preview_type  = {preview_type}
            />          
        )

    } else {

        return (
            <MessageLeft
                avatarDisp
                isBlurred = {!isAuthed}
                message={item.message}
                timestamp="MM/DD 00:00"
                photoURL={trivialString(item.avatar) ? punk : item.avatar}
                displayName={item.name ?? ""}
                preview_url = {preview_url}     
                handleClickImage = {onClickImage}           
                handleTapIcon = {onTapIcon}
                item        = {item}
                kind        = {item.kind}   
                preview_type  = {preview_type}             
            />
        )
        
    }
}



/**
 *
 * @Use: render chat window
 * @Doc: https://github.com/mattmezza/react-beautiful-chat/blob/master/src/components/MessageList.js
 *       https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/TextInput.js
 * 
**/
function ChatView(props) {

    const classes = useStyles();
    const { 
        dataSource, 
        didPressEnter, 
        showProgress,
        did_sync,
    } = props;    

    // states
    // const _dataSource = dataSource;
    // var _dataSource = [BLANK].concat(dataSource)
    const [showChat, setShowChat] = useState(false);
    const [_dataSource, setDataSource] = useState([]);

    // scroll into view
    const scrollDivRef = createRef();

    function scrollToBottom(){
        scrollDivRef.current?.scrollIntoView({
            block   : 'nearest',
            inline  : 'start',
            behavior: 'smooth',
        })        
    }

    // add blank to front of the chat
    // so it displays with offset top
    useEffect(() => {
        let chats = [BLANK].concat(dataSource);
        setDataSource(chats);
        scrollToBottom();

    }, [dataSource]);

    useEffect(() => {
        setShowChat(true)
        scrollToBottom()
    },[did_sync]);


    return (
        <div className={classes.container}>

            {/* chat header */}
            <BoardHeader hide_mood_board {...props}/>

            {/* chat window */}
            { false && !showChat ? <div/> :

                <InfiniteScroll
                    next={() => { return }}
                    hasMore={false}
                    loader={<></>}
                    style={chat_container_style}
                    dataLength={_dataSource.length}
                >   
                    {_dataSource.map((item, index) => (
                        <BubbleView 
                            {...props} 
                            key={index} 
                            item={item}
                        />
                    ))}
                    <div style={refDivStyle} ref={scrollDivRef}/>
                </InfiniteScroll>
            }

            {/* text input*/}
            <div className={classes.textInputContainer}>
                <ChatTextInput didPressEnter={didPressEnter} />
                { showProgress ? 
                    <LinearProgress color="error" style={{marginTop: '-2px'}} /> 
                    : <></> 
                }
            </div>

            {/* toast */}
            <AppSnackbar
                {...props}
                vertical={"bottom"}
                horizontal={"right"}
            />
        </div>
    )


}



export default ChatView;



