import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { fileURLToPath } from "url";
import session from "express-session";
import { dirname } from "path";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import Moralis from "moralis";
import{EvmChain} from "@moralisweb3/common-evm-utils";
import {Web3} from "web3";
import fs from 'fs';
import abi from "erc-20-abi" with { type: "json" }
import QrScanner from "qr-scanner";
const web3 = new Web3(new Web3.providers.HttpProvider("https://polygon-mainnet.infura.io/v3/9049056b2eb8402dab158c7fc245d45e"));
const chain = EvmChain.POLYGON;
const { Schema, model } = mongoose;
const userSchema = new Schema({
  fname: String,
  lname: String,
  rollno: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  pin:String,
  address: String,
  privatekey: JSON
});
const User = model("User", userSchema);

mongoose.connect(process.env.MONGO_URI, 
  {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});
const tokenaddress = process.env.TOKEN_ADDRESS;
const token = new web3.eth.Contract(abi,tokenaddress);
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

web3.eth.transactionBlockTimeout=100;

function tokenauth(req, res, next) {
  const token = req.session.accesstoken; 
  if (!token) {
    return res.redirect("/login/login.html"); 
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.redirect("/login"); 
    }
    req.email = decoded.email;
    next();
  });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function otp_() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}
let otp = "";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login/login.html");
});

app.get("/cssl", (req, res) => {
  res.sendFile(__dirname + "/public/login/stylelogin.css");
});

app.get("/back.jpg", (req, res) => {
  res.sendFile(__dirname + "/public/login/back.jpg");
});

app.get("/csscr", (req, res) => {
  res.sendFile(__dirname + "/public/login/stylecr.css");
});

app.get("/cssfp", (req, res) => {
  res.sendFile(__dirname + "/public/login/styleforgotpass.css");
});

app.get("/cssr", (req, res) => {
  res.sendFile(__dirname + "/public/login/stylereset.css");
});

app.get("/cr", (req, res) => {
  res.sendFile(__dirname + "/public/login/createacc.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login/login.html");
});

app.get("/home", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/home.html");
});


app.get("/transuccs", tokenauth, (req, res) => {
  const { receiverName, amountSent, transactionHash, status } = req.query;
  const htmlFile = __dirname + "/public/home/transactionsuccessful.html";
  fs.promises.readFile(htmlFile, 'utf8')
    .then(html => {
      let modifiedHtml = html;

      if (status === 'success') {
        modifiedHtml = modifiedHtml
          .replace("{{statusMessage}}", "Transaction Successful!")
          .replace("{{transactionDetails}}", `
            <p>Receiver: ${receiverName}</p>
            <p>Amount Sent: ${amountSent}</p>
            <p>Transaction Hash: ${transactionHash}</p>
          `);
      } else {
        modifiedHtml = modifiedHtml
          .replace("{{statusMessage}}", "Transaction Failed!")
          .replace("{{transactionDetails}}", "<p>Something went wrong. Please try again later.</p>");
      }

      res.send(modifiedHtml);
    })
    .catch(error => {
      console.error("Error reading transaction success page:", error);
      res.status(500).send("Server error");
    });
});



app.get("/connections", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/connections.html");
});

app.get("/profile", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/profile.html");
});

app.get("/homecss", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/home.css");
});

app.get("/settingscss", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/settings.css");
});

app.get("/profilecss", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/profile.css");
});

app.get("/connectionscss", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/connections.css");
});

app.get("/qr-scanner", tokenauth, (req, res) => {
  res.sendFile(__dirname + "/public/home/QRScanner.html");
});


app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Failed to destroy session:", err);
      return res.status(500).send("Failed to log out");
    }
    res.clearCookie("connect.sid"); 
    res.redirect("/login"); 
  });
});
app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }
  try {
    const results = await User.find(
      { 
        $or: [
          { fname: { $regex: query, $options: "i" } },
          { lname: { $regex: query, $options: "i" } },
          { rollno: { $regex: query, $options: "i" } }
        ]
      },
      { fname: 1, lname: 1, email: 1, rollno: 1, address: 1, _id: 0 }
    ).limit(10);
    if (results.length === 0) {
      return res.status(404).json({ message: "No matching records found" });
    }
    res.status(200).json(results);
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).json({ error: "Error fetching search results", details: err.message });
  }
});

app.get("/user-details", tokenauth, async (req, res) => {
  const { name, address } = req.query;

  try {
    let user;  
    if (name) {
      user = await User.findOne({ 
        $or: [
          { fname: name },
          { lname: name },
          { $expr: { $eq: [{ $concat: ["$fname", " ", "$lname"] }, name] } }
        ]
      });
    }  
    if (!user && address) {
      user = await User.findOne({ address: address });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      fname: user.fname,
      lname: user.lname,
      fullName: `${user.fname} ${user.lname}`,
      address: user.address,
      rollno: user.rollno
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});


app.post('/scan', async (req, res) => {
  const decodedAddress = req.body.deocdedadd;
  try {
    if (decodedAddress) {
      const user = await User.findOne({ address: decodedAddress });   
      if (user) {
        console.log(`Decoded Address: ${decodedAddress}, User: ${user.fname}`);
        res.redirect(`/payment?receiver=${encodeURIComponent(user.fname)}`);
      } else {
        res.status(404).send('User not found');
      }
    } else {
      res.status(400).send('Invalid QR Code');
    }
  } catch (error) {
    console.error('Error in /scan route:', error);
    res.status(500).send('Server error');
  }
});


app.get("/payment", tokenauth, async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.email });
    if (!currentUser) {
      return res.status(404).send("User not found");
    }
    const receiverQuery = req.query.receiver || '';
    let receiverName = '';
    let receiverAddress = '';

    const receiverUser = await User.findOne({
      $or: [
        { fname: receiverQuery },
        { address: receiverQuery }
      ]
    });

    if (receiverUser) {
      receiverName = receiverUser.fname;
      receiverAddress = receiverUser.address;
    }

    const paymentHtml = await fs.promises.readFile(__dirname + "/public/home/payment.html", 'utf8');
    const modifiedHtml = paymentHtml
      .replace(
        '<input name="name1" type="input" id="sender" placeholder="Enter your name" required>',
        `<input name="name1" type="input" id="sender" value="${currentUser.fname}" placeholder="Enter your name" required readonly>`
      )
      .replace(
        '<input name="name2" type="input" id="receiver" placeholder="Enter receiver\'s name" required>',
        `<input name="name2" type="input" id="receiver" value="${receiverName}" data-address="${receiverAddress}" placeholder="Enter receiver's name" required>`
      );

    res.send(modifiedHtml);
  } 
  catch (error) {
    console.error('Error in /payment route:', error);
    res.status(500).send('Server error');
  }
});

async function sendTransaction(a, fromAddress, toAddress, privateKey) {
  const amount = web3.utils.toWei(a, 'ether');
  const signedTransactionData = web3.eth.accounts.signTransaction({
    from: fromAddress,
    to: tokenaddress,
    data: token.methods.transfer(toAddress, amount).encodeABI(),
    gas: 60000,
    gasPrice: web3.utils.toWei('62', 'gwei'),
    nonce: await web3.eth.getTransactionCount(fromAddress, "latest"),
    chainId: 137,
  }, privateKey);

  const receipt = await web3.eth.sendSignedTransaction((await signedTransactionData).rawTransaction);
  console.log(`Transaction Hash: ${(await receipt).transactionHash}`);
  
  return { transactionHash: (await receipt).transactionHash, status: (await receipt).status };
}


app.post("/pay", async (req, res) => {
  console.log("Payment request received");
  
  try {
    const { name1, name2, amount, pin } = req.body;
    
    const user1 = await User.findOne({ fname: name1 });
    const user2 = await User.findOne({ fname: name2 });


  if (!user1 || !user2) {
    return res.status(404).send("Sender or receiver not found");
  }
  const encryptedpin = user1.pin
  console.log(encryptedpin)
  console.log(pin)
  const k = await bcrypt.compare(pin,encryptedpin)
  console.log(k)

    if (!name1 || !name2 || !amount) {
      return res.status(400).send("Missing required fields");
    }
    if(!(k)){
      return res.send("Incorrect pin")
    }

    const from = user1.address;
    const to = user2.address;
    const d = await web3.eth.accounts.decrypt(user1.privatekey,process.env.SALT);
    const privatekey = d['privateKey']
    console.log(d)
    if (!from || !to || !privatekey) {
      return res.status(400).send("Invalid user details");
    }
    console.log(`Initiating transaction from ${from} to ${to} with amount: ${amount}`);
    const receipt = await sendTransaction(amount, from, to, privatekey);
    const status = parseInt(receipt['status']);
    if (status === 1) {
      console.log(`Transaction successful: ${receipt.transactionHash}`);
      res.redirect(`/transuccs?receiverName=${name2}&amountSent=${amount}&transactionHash=${receipt.transactionHash}&status=success`);
    } else {
      console.error(`Transaction failed`);
      res.redirect(`/transuccs?status=failed`);
    }
  } catch (error) {
    console.error("Error in /pay route:", error);
    res.redirect(`/transuccs?status=failed`);
  }
});


app.post("/", async (req, res) => {
  try {
    const user = await User.findOne(
      { email: req.body.email },
      { _id: 0, lname: 0, fname: 0, rollno: 0, __v: 0 }
    );
    if (user && (await bcrypt.compare(req.body.password, user.password))) {
      const token = jwt.sign(
        { email: req.body.email },
        process.env.ACCESS_TOKEN_SECRET
      );
      req.session.accesstoken = token;
      req.session.email = req.body.email;

      res.sendFile(__dirname + "/public/home/home.html");
      console.log("Token and email stored in session");
    } else {
      res.status(401)
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/rp", async (req, res) => {
  try {
    if (req.body.new_pass1 === req.body.new_pass2) {
      const hashedPassword = await bcrypt.hash(req.body.new_pass1, 10);
      const user = await User.findOne({ email: req.body.email });

      if (user) {
        user.password = hashedPassword;
        await user.save();
        res.sendFile(__dirname + "/public/login/login.html");
      } else {
        res.status(401).send("No user detected");
      }
    } else {
      res.status(400).send("Passwords do not match");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/c", async (req, res) => {
  try {
    const { password, rollno,pin, ...userData } = req.body;
    userData.password = await bcrypt.hash(password, 10);
    
    const existingUser = await User.findOne({ rollno });
    if (!existingUser && pin.length==4) {
      
      const newWallet = await web3.eth.accounts.create();
      const newUser = new User({ ...userData, rollno});
      newUser.address=newWallet['address'];
      newUser.pin = await bcrypt.hash(pin,10);
      newUser.privatekey = await web3.eth.accounts.encrypt(newWallet['privateKey'],process.env.SALT);
      console.log(newUser);
      await newUser.save();
      res.sendFile(__dirname + "/public/login/login.html");
    } else {
      res.status(400).send("User already exists");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/sendotp", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (user) {
      otp = otp_();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `Your OTP is ${otp}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).send("Failed to send OTP");
        } else {
          console.log("Email sent: " + info.response);
          res.sendFile(__dirname + "/public/login/forgot.html");
        }
      });
    } else {
      res.status(404).send("Email not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/reset", (req, res) => {
  if (req.body.otp === otp) {
    res.sendFile(__dirname + "/public/login/reset.html");
  } else {
    console.log("Invalid OTP");
    res.status(400).send("Invalid OTP");
  }
});

app.get("/forgotpass", (req, res) => {
  res.sendFile(__dirname + "/public/login/forgot.html");
});

app.listen(port, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Server started at http://localhost:${port}`);
  }
});
async function native_balance(a) {
  const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
    "chain": "137",
      "address":a,
  })
  const x = nativeBalance.raw["balance"]/1000000000000000000;
 return x 
}

async function gettransactions(addr){
  const response = await Moralis.EvmApi.transaction.getWalletTransactions({
    "chain": "137",
    "order": "DESC",
    "address": addr
  });
  return response
}

async function getbalance(x){
  const balance = web3.utils.fromWei(await token.methods.balanceOf(x).call(),'ether');
  return balance
}  

app.get('/user', tokenauth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.email });

    if (user) {
      const bal = await getbalance(user.address);
      const transactions = await gettransactions(user.address);
      var o = [];
      var t=transactions.result;
      for(var i=0;i<t.length;i++){
        const user1 = await User.findOne({address:t[i]['from']['_value']});
        var fromadd="";
        if(user1===null){
          fromadd="unknown_user"
        }
        else{
          fromadd=user1.fname
        }
        const user2 = await User.findOne({address:t[i]['to']['_value']});
        var toadd = ""
        if(user2===null){
          toadd="unknown_user"
        }
        else{
          toadd=user2.fname
        }
        var date = t[i]['blockTimestamp'];
        date = date.toLocaleString();
        date = date.split(',')
        var value;
        var data = t[i]['data']
        if(data.substring(0,10)=='0xa9059cbb'){
          var d = web3.eth.abi.decodeParameters(['address','uint256'],data.slice(10))

          value = web3.utils.fromWei(d[1],'ether')
          value = value.toString()+" KMIT"
        }
        else{
          value = web3.utils.fromWei(t[i]['value'],'ether')
          value = value.toString()+" POL"
        }
        o.push({from:fromadd,to:toadd,date:date[0],time:date[1],value:value});

      }
 
      res.json({
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        rollno: user.rollno,
        address: user.address,
        balance: bal,
        transaction:o 
      });
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err); 
    res.status(500).send('Server error');
  }
});

app.use(express.static('public')); 


app.get("/search.js", (req, res) => {
  res.sendFile(__dirname + "/public/home/search.js");
});

app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
      res.type('application/javascript');
  }
  next();
});