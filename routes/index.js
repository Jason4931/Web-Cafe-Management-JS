var express = require('express');
var router = express.Router();

let produk = require('../models/produk.js');
let bahan = require('../models/bahan.js');
let produkbahan = require('../models/produkbahan.js');
let reportbeli = require('../models/reportbeli.js');
let reportjual = require('../models/reportjual.js');
let akun = require('../models/akun.js');

let crypto = require('crypto');
let adminenc = crypto.createHash('sha256').update('admin').digest('hex');
let userenc = crypto.createHash('sha256').update('user').digest('hex');

/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == adminenc) {
      res.render('index', { Nama: req.cookies.Nama, Role: req.cookies.Role });
    } else {
      res.render('index', { Nama: req.cookies.Nama, Role: req.cookies.Role });
    }
  } else {
    res.render('login');
  }
});
router.post('/', async function (req, res, next) {
  let akunnama = await akun.find({ Nama: req.body.Nama });
  if (akunnama.length != 0) {
    // req.session.Nama = req.body.Nama;
    // req.session.Role = akunnama[0].Role;
    let minute = 10 * 60 * 1000;
    var NamaEnc = crypto.createHash('sha256').update(req.body.Nama).digest('hex');
    var RoleEnc = crypto.createHash('sha256').update(akunnama[0].Role).digest('hex');
    res.cookie('Nama', NamaEnc, { HttpOnly: true, maxAge: minute });
    res.cookie('Role', RoleEnc, { HttpOnly: true, maxAge: minute });
  }
  res.redirect('/');
});
router.get('/register', async function (req, res, next) {
  res.render('register');
});
router.post('/register', async function (req, res, next) {
  new akun({
    Nama: req.body.Nama,
    Pass: req.body.Pass,
    Role: 'user'
  }).save();
  res.redirect('/');
});
router.get('/logout', async function (req, res, next) {
  res.clearCookie('Nama');
  res.clearCookie('Role');
  res.redirect('/');
});
router.get('/produk', async function(req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      res.render('produk', { produk: await produk.find(), produkbahan: await produkbahan.find(), bahan: await bahan.find() });
    }
  } else {
    res.render('page');
  }
});
router.get('/bahan', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      res.render('bahan', { bahan: await bahan.find() });
    }
  } else {
    res.render('page');
  }
});
router.get('/jual', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    let today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    res.render('jual', { produk: await produk.find(), today: today, err: "" });
  } else {
    res.render('page');
  }
});
router.get('/jual/err', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    let today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    res.render('jual', { produk: await produk.find(), today: today, err: "Bahan Tidak Mencukupi!" });
  } else {
    res.render('page');
  }
});
router.get('/beli', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    let today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    res.render('beli', { bahan: await bahan.find(), today: today });
  } else {
    res.render('page');
  }
});
router.get('/laporan/n', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      let reportbelis;
      let reportjuals;
      let reportb;
      let reportj;
      // let perubahan;
      let bahanp;
      let today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;
      reportbelis = await reportbeli.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        }
      ]);
      reportjuals = await reportjual.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        }
      ]);
      reportb = await reportbeli.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        },
        {
          $group: {
            _id: "$Nama",
            nama: { $first: "$Nama" },
            harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
            jumlah: { $sum: "$Jumlah" }
          }
        }
      ]);
      reportj = await reportjual.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        },
        {
          $group: {
            _id: "$Nama",
            nama: { $first: "$Nama" },
            harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
            jumlah: { $sum: "$Jumlah" }
          }
        }
      ]);
      let sisajual = await reportjual.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        },
        {
          $group:
          {
            _id: "$Nama",
            sum: { $sum: "$Jumlah" },
            Nama: { $first: "$Nama" }
          }
        },
        {
          $lookup:
          {
            from: 'produks',
            localField: 'Nama',
            foreignField: 'Nama',
            as: 'produkJual'
          }
        },
        {
          $lookup:
          {
            from: 'produkbahans',
            localField: 'produkJual.Nama',
            foreignField: 'Produk',
            as: 'jumlahBahan'
          }
        }
      ]);
      let sisabeli = await reportbeli.aggregate([
        {
          $match:
          {
            $and: [
              { Tanggal: { $gte: new Date(today) } },
              { Tanggal: { $lte: new Date(today) } }
            ]
          }
        },
        {
          $group:
          {
            _id: "$Nama",
            sum: { $sum: "$Jumlah" }
          }
        }
      ]);
      bahanp = await bahan.find();
      for (let i = 0; i < bahanp.length; i++) {
        if (sisabeli[i] != undefined) {
          bahanp[i].sisabeli = sisabeli[i].sum;
        } else {
          bahanp[i].sisabeli = 0;
        }
        if (sisajual[i] != undefined) {
          sisajual.forEach((sisajuals) => {
            sisajuals.jumlahBahan.forEach((jumlahBahan) => {
              if (bahanp[i].Nama == jumlahBahan.Bahan) {
                if (bahanp[i].sisajual == undefined) {
                  bahanp[i].sisajual = 0;
                }
                bahanp[i].sisajual += jumlahBahan.Jumlah * sisajual[i].sum;
              }
            });
          });
        } else {
          bahanp[i].sisajual = 0;
        }
      }
      // perubahan = await reportjual.find();
      //DB::select("SELECT nama, sum(jumlah) as jumlah FROM ( SELECT nama, sum(jumlah) as jumlah FROM `reportbelis`
      //WHERE created_at>='date(Y-m-d)' AND created_at<='$date' GROUP BY nama UNION ALL SELECT stocks.nama,
      //sum(product_bahans.jumlah*reportjuals.jumlah)*-1 as jumlah FROM `product_bahans` INNER JOIN products on
      //product_bahans.produk=products.id INNER JOIN stocks on product_bahans.bahan=stocks.id INNER JOIN
      //reportjuals on reportjuals.nama=products.nama WHERE reportjuals.created_at>='date(Y-m-d)' AND
      //reportjuals.created_at<='$date' GROUP BY stocks.nama ) as report GROUP BY nama")
      let enddate = 0;
      let tglpertama = [{ min: 0 }];
      res.render('laporan', { reportjual: reportjuals, reportbeli: reportbelis, datenow: today, reportb: reportb, reportj: reportj, bahan: bahanp, state: "n", tglpertama: tglpertama, enddate: enddate });
    }
  } else {
    res.render('page');
  }
});
router.post('/laporan/p', async function(req, res, next) {
  let start = req.body.start;
  let end = req.body.end;
  let reportbelis;
  let reportjuals;
  let reportb;
  let reportj;
  // let perubahan;
  let bahanp;
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  reportbelis = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportjuals = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportb = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportj = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  let sisajual = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $group:
      {
        _id : "$Nama",
        sum : { $sum: "$Jumlah" },
        Nama: { $first: "$Nama" }
      }
    },
    { $lookup:
      {
        from: 'produks',
        localField: 'Nama',
        foreignField: 'Nama',
        as: 'produkJual'
      }
    },
    { $lookup:
      {
        from: 'produkbahans',
        localField: 'produkJual.Nama',
        foreignField: 'Produk',
        as: 'jumlahBahan'
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  let sisabeli = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group:
      {
        _id: "$Nama",
        sum: { $sum: "$Jumlah" }
      }
    },
    { $sort: { Tanggal: 1 } }
  ]);
  let tglpertama = await reportbeli.aggregate([
    {
      $group:
      {
        _id: "$Tanggal",
        min: { $min: "$Tanggal" }
      }
    }
  ]);
  bahanp = await bahan.find();
  for (let i = 0; i < bahanp.length; i++) {
    if (sisabeli[i] != undefined) {
      bahanp[i].sisabeli = sisabeli[i].sum;
    } else {
      bahanp[i].sisabeli = 0;
    }
    if (sisajual[i] != undefined) {
      sisajual.forEach((sisajuals) => {
        sisajuals.jumlahBahan.forEach((jumlahBahan) => {
          if (bahanp[i].Nama == jumlahBahan.Bahan) {
            if (bahanp[i].sisajual == undefined) {
              bahanp[i].sisajual = 0;
            }
            bahanp[i].sisajual += jumlahBahan.Jumlah * sisajual[i].sum;
          }
        });
      });
    } else {
      bahanp[i].sisajual = 0;
    }
  }
  // perubahan = await reportjual.find();
  let enddate = new Date(end);
  res.render('laporan', { reportjual: reportjuals, reportbeli: reportbelis, datenow: today, start: start, end: end, enddate: enddate, reportb: reportb, reportj: reportj, bahan: bahanp, state: "p", tglpertama: tglpertama });
});
router.post('/create/:for', async function(req, res, next) {
  try {
    if(req.params.for == "bahan") {
      new bahan({
        Nama: req.body.nama,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      }).save();
    } else if(req.params.for == "produk") {
      new produk({
        Nama: req.body.nama,
        Harga: req.body.harga,
        Kategori: req.body.kategori
      }).save();
    } else if(req.params.for == "produkbahan") {
      let bbahan = await bahan.find({ Nama: req.body.bahan });
      req.body.satuan = bbahan[0].Satuan;
      new produkbahan({
        Produk: req.body.produk,
        Bahan: req.body.bahan,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      }).save();
      req.params.for = "produk";
    }
    res.redirect('/'+req.params.for);
  } catch(error) {
    return next(error);
  }
});
router.post('/update/:for', async function(req, res, next) {
  try {
    if(req.params.for == "bahan") {
      await bahan.findByIdAndUpdate(req.body._id, {
        Nama: req.body.nama,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      });
    } else if(req.params.for == "produk") {
      await produk.findByIdAndUpdate(req.body._id, {
        Nama: req.body.nama,
        Harga: req.body.harga,
        Kategori: req.body.kategori
      });
    } else if(req.params.for == "produkbahan") {
      let bbahan = await bahan.find({ Nama: req.body.bahan });
      req.body.satuan = bbahan[0].Satuan;
      await produkbahan.findByIdAndUpdate(req.body._id, {
        Produk: req.body.produk,
        Bahan: req.body.bahan,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      });
      req.params.for = "produk";
    }
    res.redirect('/'+req.params.for);
  } catch(error) {
    return next(error);
  }
});
router.get('/delete/:for/:id', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      try {
        if (req.params.for == "bahan") {
          await bahan.findByIdAndDelete(req.params.id);
        } else if (req.params.for == "produk") {
          await produk.findByIdAndDelete(req.params.id);
        } else if (req.params.for == "produkbahan") {
          await produkbahan.findByIdAndDelete(req.params.id);
          req.params.for = "produk";
        }
        res.redirect('/' + req.params.for);
      } catch (error) {
        return next(error);
      }
    }
  }
});
async function min(nama, angka) {
  let Bahan = await bahan.find({ Nama: nama });
  angka = Number(angka);
  let PJumlah = Bahan[0].Jumlah - angka;
  if(PJumlah < 0) {
    return true;
  } else {
    await bahan.findOneAndUpdate({Nama: nama}, {
      Jumlah: PJumlah
    });
    return false;
  }
}
async function plus(nama, angka) {
  let Bahan = await bahan.find({ Nama: nama });
  angka = Number(angka);
  let PJumlah = Bahan[0].Jumlah + angka;
  await bahan.findOneAndUpdate({Nama: nama}, {
    Jumlah: PJumlah
  });
}
router.post('/processjual', async function(req, res, next) {
  try {
    let jproduk = await produk.find({ Nama: req.body.nama });
    jproduk[0].Kategori == "Makanan" ? req.body.satuan = "Piring" : req.body.satuan = "Gelas";
    req.body.harga == "" ? req.body.harga = jproduk[0].Harga : null;
    let check = true;
    let jprodukbahan = await produkbahan.find({ Produk: req.body.nama });
    await jprodukbahan.forEach(function(jprodukbahan) {
      let angka = req.body.jumlah * jprodukbahan.Jumlah;
      min(jprodukbahan.Bahan, angka).then(bool => {
        if(bool) {
          check = false;
        }
      });
    });
    setTimeout(() => {
      if(check) {
        new reportjual({
          Nama: req.body.nama,
          Jumlah: req.body.jumlah,
          Harga: req.body.harga,
          Satuan: req.body.satuan,
          Tanggal: req.body.tanggal
        }).save();
        res.redirect('/jual');
      } else {
        jprodukbahan.forEach(function(jprodukbahan) {
          plus(jprodukbahan.Bahan, req.body.jumlah * jprodukbahan.Jumlah);
        });
        res.redirect('/jual/err');
      }
    }, 100);
  } catch(error) {
    return next(error);
  }
});
router.post('/processbeli', async function(req, res, next) {
  try {
    let bbahan = await bahan.find({ Nama: req.body.nama });
    req.body.satuan = bbahan[0].Satuan;
    plus(req.body.nama, req.body.jumlah);
    new reportbeli({
      Nama: req.body.nama,
      Jumlah: req.body.jumlah,
      Harga: req.body.harga,
      Satuan: req.body.satuan,
      Tanggal: req.body.tanggal
    }).save();
    res.redirect('/beli');
  } catch(error) {
    return next(error);
  }
});
router.get('/renderp', async function(req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      res.json(
        await produk.find()
      );
    }
  }
});
router.get('/renderb', async function (req, res, next) {
  if (req.cookies.Nama != undefined) {
    if (req.cookies.Role == "admin") {
      res.json(
        await bahan.find()
      );
    }
  }
});

module.exports = router;