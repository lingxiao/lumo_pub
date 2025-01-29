/**
	@Module: email
	@Date  : 8/17/2020
	@Author: Xiao Ling
*/


const nodemailer = require("nodemailer");


async function adminLog({ title, text }){

	const mailTransport = nodemailer.createTransport({
		  service: "gmail"
		, auth: {
		    user:  ''
		  , pass: ''
		}
	})

	const mailOptions = {
		  from   : ''
		, to     : ''
		, subject: title
		, html   : text
	}

	await mailTransport
		.sendMail(mailOptions)
		.then (x => true ) 
		.catch(e => false) 

}


exports.adminLog = adminLog

