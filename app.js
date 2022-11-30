const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
app.use(express.urlencoded({ extended: true }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
require('dotenv').config();
app.use('/public', express.static('public'));
const { ObjectId } = require('mongodb');
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

// DB 서버 구현
var db;
MongoClient.connect(process.env.DATABASE_URL, (err, client) => {
  if (err) return console.log(err);

  db = client.db('ToDoApp');
  http.listen(process.env.PORT, () => {
    console.log('listening on Port : 8080');
  });
});

const crypto = require('crypto');
const util = require('util');

const randomBytesPromise = util.promisify(crypto.randomBytes);
const pbkdf2Promise = util.promisify(crypto.pbkdf2);

// Salt 생성
const createSalt = async () => {
  const buf = await randomBytesPromise(64);
  return buf.toString('base64');
};

// 비밀번호 암호화
const createHashedPassword = async (password) => {
  const salt = await createSalt();
  const key = await pbkdf2Promise(password, salt, 104906, 64, 'sha512');
  const hashedPassword = key.toString('base64');

  return { hashedPassword, salt };
};

// 비밀번호 검증
const verifyPassword = async (password, userSalt, userPassword) => {
  const key = await pbkdf2Promise(password, userSalt, 104906, 64, 'sha512');
  const hashedPassword = key.toString('base64');
  if (hashedPassword === userPassword) return true;
  return false;
};

// 로그인 기능 제작
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: 'secretCode', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// 로그인 페이지 서버 전송
app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login', // 실패했을 경우 리다이렉트
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect('/'); // 성공했을 경우 홈페이지로 이동
  }
);

// 아이디, 비밀번호 검증
passport.use(
  new LocalStrategy(
    {
      usernameField: 'id',
      passwordField: 'pw',
      session: true,
      passReqToCallback: false,
    },
    async (id, password, done) => {
      try {
        const user = await db.collection('login').findOne({ id: id });
        // 아이디 검증
        if (!user) return done(null, false, { message: '존재하지 않는 아이디입니다.' });

        // 비밀번호 검증
        const verified = await verifyPassword(password, user.salt, user.pw);
        if (!verified) return done(null, false, { message: '비밀번호가 틀렸어요.' });

        // 로그인 성공
        done(null, user);
      } catch {
        done(null, false, { message: '문제가 발생했습니다. 죄송합니다.' });
      }
    }
  )
);

// 로그인 정보 Session ID 발급하여 Cookie 저장
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((sessionID, done) => {
  db.collection('login').findOne({ id: sessionID }, (error, user) => {
    done(null, user);
  });
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// 로그인 확인 미들웨어 작성
const isLogin = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// 회원가입
app.post('/register', async (req, res) => {
  const userID = await req.body.id;
  const isExist = await db.collection('login').findOne({ id: userID });
  if (!isExist) {
    const userPASSWORD = await req.body.pw;
    const { hashedPassword, salt } = await createHashedPassword(userPASSWORD);
    db.collection('login').insertOne({ id: userID, pw: hashedPassword, salt: salt }, (error, result) => {
      res.redirect('/login');
    });
  } else res.redirect('/register');
});

// 페이지 라우팅 모음
app.get('/', (req, res) => {
  res.render('index.ejs', { user: req.user });
});

app.get('/write', isLogin, (req, res) => {
  res.render('write.ejs');
});

app.get('/list', isLogin, (req, res) => {
  db.collection('post')
    .find()
    .toArray((err, result) => {
      res.render('list.ejs', { posts: result, user: req.user._id });
    });
});

app.get('/edit/:id', isLogin, (req, res) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
    if (err) {
      res.redirect('/404');
      console.log(err);
    }
    res.render('edit.ejs', { post: result });
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.get('/mypage', isLogin, (req, res) => {
  db.collection('post')
    .find({ writer: ObjectId(req.user._id) })
    .toArray()
    .then((posts) => {
      res.render('mypage.ejs', { posts: posts, user: req.user });
    });
});

// 게시글 Create
app.post('/add', (req, res) => {
  db.collection('counter').findOne({ name: 'post length' }, (err, result) => {
    if (err) return console.log(err);
    let postTotalLength = result.totalPost;
    const postContent = { _id: (postTotalLength += 1), writer: req.user._id, title: req.body.title, date: req.body.date };
    db.collection('post').insertOne(postContent, (err, result) => {
      db.collection('counter').updateOne({ name: 'post length' }, { $inc: { totalPost: 1 } }, (err, result) => {
        if (err) return console.log(err);
      });
    });
  });

  res.redirect('/list');
});

// 게시글 Read
app.get('/detail/:id', isLogin, (req, res) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
    if (err) {
      res.redirect('/404');
      console.log(err);
    }
    res.render('detail.ejs', { post: result, user: req.user._id });
  });
});

// 게시글 Delete
app.delete('/delete', (req, res) => {
  const deleteData = { _id: parseInt(req.body._id), writer: req.user._id };
  db.collection('post').deleteOne(deleteData, (err, result) => {
    if (err) console.log(err);
    res.status(200).send({ message: `${req.body._id}번째 글 삭제완료` });
  });
});

// 게시글 Update
app.put('/edit', (req, res) => {
  const editData = { _id: parseInt(req.body.id), writer: req.user._id };
  const editContent = { title: req.body.title, date: req.body.date };
  db.collection('post').updateOne(editData, { $set: editContent }, (err, result) => {
    if (err) console.log(err);
    res.redirect('/list');
  });
});

// 검색 기능
app.get('/search', isLogin, (req, res) => {
  // 검색 조건 정의
  const searchCondtion = [
    {
      $search: {
        index: 'contentSearch',
        text: {
          query: req.query.value,
          path: 'title', // 복수로 찾고 싶으면 []에 넣으면 됨
        },
      },
    },
    { $sort: { _id: 1 } },
    // { $limit: 10 } 갯수제한
    // { $project: { title: 1, _id: 1, date: 1, scroe: { $meta: 'searchScore' } } },
    // 검색 조건 복수로 주기 0은 검색X, 1은 검색O, scroe는 검색 많이된 점수를 부여함
  ];

  db.collection('post')
    .aggregate(searchCondtion)
    .toArray((error, result) => {
      res.render('search.ejs', { posts: result, user: req.user._id });
    });
});

// 업로드 페이지 구현
app.get('/upload', isLogin, (req, res) => {
  res.render('upload.ejs');
});

// multer 기본 셋팅
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  // 저장 위치 설정
  destination: (req, file, cb) => {
    cb(null, './public/image');
  },
  // 파일 이름 설정
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  // 파일 확장자 제한
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('PNG, JPG만 업로드하세요'));
    }
    callback(null, true);
  },
  // 사이즈 제한
  limits: {
    fileSize: 1024 * 1024, // 1mb
  },
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('photo'), (req, res) => {
  res.send('업로드완료');
});

// 업로드된 사진 출력
app.get('/image/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  res.sendFile(__dirname + `/public/image/${imageName}`);
});

// 채팅방 구현
app.get('/chat', isLogin, async (req, res) => {
  // 채팅방 리스트 구현
  await db
    .collection('chatroom')
    .find({ $or: [{ 'participant.maker': req.user._id }, { 'participant.opponent': req.user._id }] })
    .toArray()
    .then(async (result) => {
      const chatroomRawData = await Promise.all(
        result.map(async (data) => {
          const makerID = await db
            .collection('login')
            .findOne({ _id: data.participant.maker })
            .then((makerUser) => makerUser);

          const opponentID = await db
            .collection('login')
            .findOne({ _id: data.participant.opponent })
            .then((opponentUser) => opponentUser);

          const result = await {
            _id: data._id,
            title: data.title,
            number: data.number,
            maker: makerID.id,
            opponent: opponentID.id,
          };

          return await result;
        })
      );

      return await chatroomRawData;
    })
    .then((chatRoomData) => {
      res.render('chat.ejs', { chatRoom: chatRoomData, currentUser: req.user.id });
    });
});

// 채팅방 개설
app.post('/chatroom', (req, res) => {
  db.collection('chatroom')
    // 채팅방 중복 개설 방지
    .find({ postNumber: parseInt(req.body.postNumber) }, { participant: { $elemMatch: { maker: req.user._id } } })
    .toArray((error, result) => {
      if (error) res.send(error);
      // 중복이 없을 시에 채팅방 개설
      if (result.length === 0) {
        const template = {
          title: req.body.postTitle,
          postNumber: parseInt(req.body.postNumber),
          participant: {
            maker: req.user._id,
            opponent: ObjectId(req.body.chatPartner),
          },
          date: new Date(),
        };
        db.collection('chatroom').insertOne(template, (error, result) => {
          if (error) res.send(error);
          if (result) {
            res.redirect('/chat');
          }
        });
      } else {
        res.redirect('/chat');
      }
    });
});

// 메세지 발송
app.post('/message', isLogin, (req, res) => {
  const message = {
    parent: ObjectId(req.body.parent),
    content: req.body.content,
    use_id: req.user._id,
    user_name: req.user.id,
    date: new Date(),
  };
  db.collection('message').insertOne(message, (error, result) => {
    if (error) res.send(error);
    if (result) res.send(result);
  });
});

// 메세지 출력
app.get('/message/:parentID', isLogin, (req, res) => {
  // prettier-ignore
  // 실시간 소통 채널 개설
  res.writeHead(200, { 
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
   });

  // 실시간으로 업데이트되는 data 받아옴
  db.collection('message')
    .find({ parent: ObjectId(req.params.parentID) })
    .toArray()
    .then((result) => {
      res.write('event: message\n');
      res.write(`data: ${JSON.stringify(result)}\n\n`);
    });

  // Change Stream 설정
  const pipeline = [{ $match: { 'fullDocument.parent': ObjectId(req.params.parentID) } }];
  const collection = db.collection('message');
  const changeStream = collection.watch(pipeline);
  changeStream.on('change', (change) => {
    res.write('event: message\n');
    res.write(`data: ${JSON.stringify([change.fullDocument])}\n\n`);
  });
});

// WebSocket 구현
app.get('/socket', isLogin, (req, res) => {
  res.render('socket.ejs');
});

// WebSocket 접속
io.on('connection', (socket) => {
  // 전체 채팅방에 메세지 출력
  socket.on('big-send', (data) => {
    io.emit('broadcast', data);
  });
  // 개설 채팅방에 입장
  socket.on('joinRoom', (data) => {
    socket.join('smallRoom');
  });
  // 개설 채팅방에 메세지 출력
  socket.on('small-send', (data) => {
    io.to('smallRoom').emit('small-chat', data);
  });
});
