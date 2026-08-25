"""
Extended Seed Script — IR-IWQMS Comprehensive Demo Data
Southern Railway (SR) with complete workflow demonstrations.

Run: python seed_extended.py
"""
import sys, os, datetime, json
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

from database import SessionLocal, engine, Base
from models import user, hierarchy, master, lab, alert, workflow, audit  # noqa

Base.metadata.create_all(bind=engine)
db = SessionLocal()

now = datetime.datetime.utcnow()


def seed_all():
    print("[SEED] Starting IR-IWQMS extended seed (Southern Railway demo)...")

    # ─────────────────────────────────────────────────────────────────────────
    # USERS
    # ─────────────────────────────────────────────────────────────────────────
    from models.user import User, UserRole
    from core.security import get_password_hash

    users_data = [
        dict(employee_id="central.admin", name="Central Admin", email="central.admin@sr.ir.in",
             role="CENTRAL_ADMIN", password="admin123"),
        dict(employee_id="zonal.admin", name="Zonal Admin SR", email="zonal.admin@sr.ir.in",
             role="ZONAL_ADMIN", password="admin123"),
        dict(employee_id="division.officer", name="Div Officer Chennai", email="division.officer@sr.ir.in",
             role="DIVISIONAL_OFFICER", password="admin123"),
        dict(employee_id="hmi.user", name="H&MI Chennai", email="hmi.user@sr.ir.in",
             role="HMI", password="admin123"),
        dict(employee_id="lab.user", name="Lab Technician SR", email="lab.user@sr.ir.in",
             role="LABORATORY", password="admin123"),
        dict(employee_id="engineering.user", name="Sec Engineer MAS", email="engineering.user@sr.ir.in",
             role="ENGINEERING", password="admin123"),
        dict(employee_id="station.user", name="Station Incharge MAS", email="station.user@sr.ir.in",
             role="STATION_INCHARGE", password="admin123"),
        dict(employee_id="management.user", name="Senior Mgmt SR", email="management.user@sr.ir.in",
             role="SENIOR_MANAGEMENT", password="admin123"),
        dict(employee_id="DO-TPJ-001", name="Div Officer Trichy", email="do.tpj2@ir.in",
             role="DIVISIONAL_OFFICER", password="admin123"),
        dict(employee_id="HMI-TBM-001", name="H&MI Tambaram", email="hmi.tbm2@ir.in",
             role="HMI", password="admin123"),
    ]

    user_map = {}
    for u in users_data:
        existing = db.query(User).filter(User.employee_id == u["employee_id"]).first()
        if not existing:
            new_user = User(
                employee_id=u["employee_id"], name=u["name"], email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"], is_active=True,
            )
            db.add(new_user)
            db.flush()
            user_map[u["employee_id"]] = new_user
            print(f"  [USER] {u['employee_id']} ({u['role']})")
        else:
            user_map[u["employee_id"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # ZONES
    # ─────────────────────────────────────────────────────────────────────────
    from models.hierarchy import Zone, Division, Station, WaterSource

    zones_data = [
        dict(name="Southern Railway", code="SR"),
    ]
    zone_map = {}
    for z in zones_data:
        existing = db.query(Zone).filter(Zone.code == z["code"]).first()
        if not existing:
            obj = Zone(**z); db.add(obj); db.flush()
            zone_map[z["code"]] = obj
            print(f"  [ZONE] {z['name']}")
        else:
            zone_map[z["code"]] = existing
    db.commit()

    # Update zone users
    if "zonal.admin" in user_map:
        user_map["zonal.admin"].zone_id = zone_map["SR"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # DIVISIONS (SR focus)
    # ─────────────────────────────────────────────────────────────────────────
    divs_data = [
        dict(name="Chennai Division", code="MAS", zone_code="SR"),
        dict(name="Salem Division", code="SA", zone_code="SR"),
        dict(name="Coimbatore Division", code="CBE", zone_code="SR"),
        dict(name="Palakkad Division", code="PGT", zone_code="SR"),
        dict(name="Trivandrum Division", code="TVC", zone_code="SR"),
    ]
    div_map = {}
    for d in divs_data:
        existing = db.query(Division).filter(Division.code == d["code"]).first()
        if not existing:
            obj = Division(name=d["name"], code=d["code"], zone_id=zone_map[d["zone_code"]].id)
            db.add(obj); db.flush()
            div_map[d["code"]] = obj
            print(f"  [DIV] {d['name']}")
        else:
            div_map[d["code"]] = existing
    db.commit()

    if "division.officer" in user_map:
        user_map["division.officer"].division_id = div_map["MAS"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # STATIONS
    # ─────────────────────────────────────────────────────────────────────────
    stations_data = [
        dict(name="Chennai Central", code="MAS", cat="NSG1", div="MAS", lat=11.3315, lng=77.8932),
        dict(name="Chennai egmore", code="MS", cat="NSG 1", div="SA", lat=9.429, lng=79.4451),
        dict(name="Tambaram", code="TBM", cat="NSG1", div="CBE", lat=10.6337, lng=78.2803),
        dict(name="Arakkonam jn", code="AJJ", cat="NSG 2", div="PGT", lat=8.0352, lng=78.8291),
        dict(name="Avadi", code="AVD", cat="NSG 2", div="TVC", lat=12.7067, lng=76.3139),
        dict(name="Chengalpattu jn.", code="CGL", cat="NSG 2", div="MAS", lat=9.538, lng=79.8221),
        dict(name="Katpadi", code="KPD", cat="NSG 2", div="SA", lat=8.9922, lng=78.8822),
        dict(name="Tiruvallur", code="TRL", cat="NSG 2", div="CBE", lat=10.5973, lng=76.1778),
        dict(name="Coimbatore jn", code="CBE", cat="NSG 2", div="PGT", lat=9.8204, lng=77.1248),
        dict(name="Kozhikkode", code="CLT", cat="NSG 2", div="TVC", lat=8.2775, lng=79.435),
        dict(name="Ernakulam jn", code="ERS", cat="NSG 2", div="MAS", lat=12.6373, lng=76.8644),
        dict(name="Thrissur", code="TCR", cat="NSG 2", div="SA", lat=11.1568, lng=77.7519),
        dict(name="Tiruvananthapuram central", code="TVC", cat="NSG 2", div="CBE", lat=10.2208, lng=78.0561),
        dict(name="Madurai jn", code="MDU", cat="NSG2", div="PGT", lat=8.5571, lng=77.1597),
        dict(name="Guduvancheri", code="Gl", cat="NSG3", div="TVC", lat=11.6096, lng=76.5502),
        dict(name="Jolarpettai", code="JTJ", cat="NSG3", div="MAS", lat=12.8495, lng=77.8381),
        dict(name="Mambalam", code="MBM", cat="NSG3", div="SA", lat=9.9867, lng=79.2051),
        dict(name="Perambur", code="PER", cat="NSG3", div="CBE", lat=11.2017, lng=77.0966),
        dict(name="Perungalathur (FLAG", code="PRGL", cat="NSG3", div="PGT", lat=11.9196, lng=77.7339),
        dict(name="Erode Jn", code="ED", cat="NSG 3", div="TVC", lat=10.1435, lng=77.5708),
        dict(name="Salem jn", code="SA", cat="NSG 3", div="MAS", lat=12.3531, lng=78.7118),
        dict(name="Tiruppur", code="TUP", cat="NSG3", div="SA", lat=9.1165, lng=76.931),
        dict(name="Kannur", code="CAN", cat="NSG 3", div="CBE", lat=12.3653, lng=79.9552),
        dict(name="Mangalore Central", code="MAQ", cat="NSG3", div="PGT", lat=12.6743, lng=79.1325),
        dict(name="Mangalore jn", code="MAJN", cat="NSG3", div="TVC", lat=8.1873, lng=76.3744),
        dict(name="Palakkad jn.", code="PGT", cat="NSG 3", div="MAS", lat=8.5315, lng=76.192),
        dict(name="Shoranur jn.", code="SRR", cat="NSG 3", div="SA", lat=11.4174, lng=76.5761),
        dict(name="Thalassery", code="TLY", cat="NSG3", div="CBE", lat=12.9718, lng=76.1615),
        dict(name="Tirur", code="TIR", cat="NSG3", div="PGT", lat=11.6329, lng=77.9099),
        dict(name="Vadakara", code="BDJ", cat="NSG 3", div="TVC", lat=9.2717, lng=77.2919),
        dict(name="Alappuzha", code="ALLP", cat="NSG 3", div="MAS", lat=12.605, lng=78.7763),
        dict(name="Aluva", code="AWY", cat="NSG3", div="SA", lat=8.2783, lng=77.6899),
        dict(name="Chengannur", code="CNGR", cat="NSG 3", div="CBE", lat=11.9148, lng=79.7736),
        dict(name="Ernakulam town", code="ERN", cat="NSG3", div="PGT", lat=11.0012, lng=76.1213),
        dict(name="Kayankulam jn", code="KYJ", cat="NSG 3", div="TVC", lat=12.5915, lng=79.0704),
        dict(name="Kochuveli", code="KCVL", cat="NSG3", div="MAS", lat=8.7698, lng=77.1759),
        dict(name="Kollam jn", code="QLN", cat="NSG3", div="SA", lat=8.0904, lng=79.8013),
        dict(name="Kottayam", code="KTYM", cat="NSG3", div="CBE", lat=9.0078, lng=76.6373),
        dict(name="Nagercoil jn", code="NCJ", cat="NSG 3", div="PGT", lat=10.675, lng=78.1498),
        dict(name="Thanjavur jn", code="TJ", cat="NSG 3", div="TVC", lat=9.5189, lng=76.8727),
        dict(name="Tiruchchirappalli jn", code="TPJ", cat="NSG3", div="MAS", lat=10.835, lng=78.1129),
        dict(name="Villupuram jn.", code="VM", cat="NSG3", div="SA", lat=9.6989, lng=77.3822),
        dict(name="Dindigul jn", code="DG", cat="NSG 3", div="CBE", lat=9.6818, lng=78.3246),
        dict(name="Rameswaram", code="RMM", cat="NSG 3", div="PGT", lat=8.2575, lng=79.2208),
        dict(name="Tirunelveli jn", code="TEN", cat="NSG3", div="TVC", lat=9.6318, lng=76.6185),
        dict(name="Tuticorin", code="TN", cat="NSG3", div="MAS", lat=8.8529, lng=78.1663),
        dict(name="Kanchipuram", code="CJ", cat="NSG4", div="SA", lat=11.6791, lng=78.755),
        dict(name="Melmaruvathur", code="MLMR", cat="NSG 4", div="CBE", lat=10.1969, lng=76.5128),
        dict(name="Singaperumalkoil", code="SKL", cat="NSG 4", div="PGT", lat=12.5816, lng=79.751),
        dict(name="Tiruttani", code="TRT", cat="NSG 4", div="TVC", lat=11.9046, lng=78.3252),
        dict(name="Coonoor", code="ONR", cat="NSG 4", div="MAS", lat=12.6274, lng=78.267),
        dict(name="Karur jn.", code="KRR", cat="NSG 4", div="SA", lat=11.1477, lng=79.6892),
        dict(name="Mettupalaiyam", code="MTP.", cat="NSG 4", div="CBE", lat=12.5014, lng=77.6087),
        dict(name="Udagamandalam", code="UAM", cat="NSG4", div="PGT", lat=10.4318, lng=77.9735),
        dict(name="Bekal Fort flag", code="BFR", cat="NSG 4", div="TVC", lat=8.0926, lng=79.0028),
        dict(name="Kanhangad", code="KZE", cat="NSG 4", div="MAS", lat=10.7521, lng=77.7808),
        dict(name="Kasargod", code="KGQ", cat="NSG 4", div="SA", lat=10.969, lng=77.0358),
        dict(name="Kuttipuram", code="KTU", cat="NSG 4", div="CBE", lat=9.4136, lng=79.9007),
        dict(name="Mahe", code="OTP", cat="NSG 4", div="PGT", lat=10.9502, lng=77.2926),
        dict(name="Ottappalam", code="PAY", cat="NSG 4", div="TVC", lat=10.5964, lng=76.4286),
        dict(name="Payyannur", code="QLD", cat="NSG3", div="MAS", lat=9.2305, lng=76.9477),
        dict(name="Quilandi", code="ULL", cat="NSG 4", div="SA", lat=11.9229, lng=77.0868),
        dict(name="Ullal", code="AFK", cat="NSG 4", div="CBE", lat=11.6178, lng=79.5076),
        dict(name="", code="Angamali for kaladi", cat="CGY", div="PGT", lat=12.713, lng=77.7925),
        dict(name="Changanacheri", code="GUV", cat="NSG 4", div="TVC", lat=12.5568, lng=79.7397),
        dict(name="Guruvayur", code="CAPE", cat="NSG4", div="MAS", lat=12.8178, lng=79.7393),
        dict(name="Kanniyakumari", code="TRVL", cat="NSG 4", div="SA", lat=12.0054, lng=78.9867),
        dict(name="Tiruvalla", code="VAK", cat="NSG 4", div="CBE", lat=10.3722, lng=76.6389),
        dict(name="Varkalashivagiri", code="KMU", cat="NSG 4", div="PGT", lat=9.4494, lng=78.565),
        dict(name="Kumbakonam", code="MV", cat="NSG 4", div="TVC", lat=12.0044, lng=79.3751),
        dict(name="Mayiladuthurai jn.", code="NGT", cat="NSG4", div="MAS", lat=8.5941, lng=77.9504),
        dict(name="Nagappattinam", code="PDY", cat="NSG 4", div="SA", lat=11.6031, lng=78.4803),
        dict(name="Karaikkudi jn", code="KKDI", cat="NSG 4", div="CBE", lat=8.4879, lng=76.6868),
        dict(name="Kovilpatti", code="CVP", cat="NSG 4", div="PGT", lat=9.7944, lng=76.4435),
        dict(name="Palani", code="PLNI", cat="NSG 4", div="TVC", lat=8.6633, lng=78.248),
        dict(name="Ramanathapuram", code="RMD", cat="NSG 4", div="MAS", lat=9.4205, lng=76.5607),
        dict(name="Tenkasi jn", code="TSI", cat="NSG 4", div="SA", lat=12.9596, lng=78.5964),
        dict(name="Tiruchendur", code="TCN", cat="NSG4", div="CBE", lat=11.6116, lng=78.5174),
        dict(name="Virudhunagar jn", code="VPT", cat="NSG 4", div="PGT", lat=11.0425, lng=76.4017),
        dict(name="Ambur", code="AB", cat="NSG5", div="TVC", lat=12.9764, lng=79.1778),
        dict(name="Ekambarakuppam (FLAG", code="EKM", cat="NSG5", div="MAS", lat=12.6076, lng=77.3299),
        dict(name="Gudiyatham", code="GYM", cat="NSG5", div="SA", lat=12.4866, lng=77.32),
        dict(name="Kattangulathur", code="CIM", cat="NSGS", div="CBE", lat=8.5233, lng=78.2905),
        dict(name="Nayudupeta", code="NYP", cat="NSG5", div="PGT", lat=9.0637, lng=76.134),
        dict(name="Puttur", code="PUT", cat="NSG5", div="TVC", lat=9.5502, lng=76.4571),
        dict(name="Sholinghur", code="SHU", cat="NSG5S", div="MAS", lat=12.1279, lng=78.4838),
        dict(name="Sullurupeta", code="SPE", cat="NSGS", div="SA", lat=9.3614, lng=78.5343),
        dict(name="Tindivanam", code="TMV", cat="NSG5", div="CBE", lat=11.2237, lng=78.192),
        dict(name="Vandalur", code="VDR", cat="NSG5", div="PGT", lat=10.8245, lng=77.7939),
        dict(name="\Vaniyambadi", code="VN", cat="NSG5", div="TVC", lat=10.6307, lng=79.0022),
        dict(name="Walajaroad", code="WJR", cat="NSGS", div="MAS", lat=12.62, lng=76.6965),
        dict(name="Bommidi", code="Bal", cat="NSG5", div="SA", lat=8.2472, lng=79.7041),
        dict(name="Chinna salem", code="CHSM", cat="NSG5", div="CBE", lat=10.6022, lng=76.824),
        dict(name="Kulitalai", code="KLT", cat="NSG5S", div="PGT", lat=12.5448, lng=76.8842),
        dict(name="Morappur", code="MAP.", cat="NSGS", div="TVC", lat=8.0712, lng=78.9417),
        dict(name="Namakkal", code="NMKL", cat="NSG5", div="MAS", lat=9.4555, lng=76.3677),
        dict(name="Pugalur", code="PGR", cat="NSGS", div="SA", lat=10.8003, lng=77.7123),
        dict(name="Salem town", code="SXT", cat="NSG5", div="CBE", lat=12.4681, lng=78.6229),
        dict(name="Sankaridurg", code="SGE", cat="NSG5", div="PGT", lat=11.2014, lng=79.0397),
        dict(name="Angadipuram", code="AAM", cat="NSGS", div="TVC", lat=8.0531, lng=77.2926),
        dict(name="Charvattur", code="CHV", cat="NSGS", div="MAS", lat=11.7144, lng=77.3137),
        dict(name="Ferok", code="FK", cat="NSG5", div="SA", lat=8.8355, lng=77.4632),
        dict(name="Kannapuram", code="KPQ", cat="NSG5", div="CBE", lat=9.2853, lng=78.3735),
        dict(name="Kumbla", code="KMQ", cat="NSG5", div="PGT", lat=8.0648, lng=78.875),
        dict(name="Nilambur road", code="NIL", cat="NSGS", div="TVC", lat=10.4202, lng=76.6651),
        dict(name="Nileshwar", code="NLE", cat="NSG5", div="MAS", lat=10.2866, lng=77.0573),
        dict(name="Palakkad town", code="PGTN", cat="NSG5", div="SA", lat=11.9505, lng=76.8885),
        dict(name="Parapanangadi", code="PGI", cat="NSG5S", div="CBE", lat=8.0726, lng=76.01),
        dict(name="Pattambi", code="PTB", cat="NSG5S", div="PGT", lat=12.6915, lng=76.9173),
        dict(name="Payangadi", code="PAZ", cat="NSG5", div="TVC", lat=9.8606, lng=76.6908),
        dict(name="Pollachi", code="POY", cat="NSG5", div="MAS", lat=8.1384, lng=79.4341),
        dict(name="Tanur", code="TA", cat="NSG5", div="SA", lat=10.8452, lng=76.5014),
        dict(name="\Vaniyambalam", code="VNB", cat="NSGS", div="CBE", lat=12.7441, lng=79.5951),
        dict(name="", code="Ambalapuzha", cat="AMPA", div="PGT", lat=8.4385, lng=76.1772),
        dict(name="Chalakudi", code="CKI", cat="NSG5", div="TVC", lat=11.1748, lng=77.347),
        dict(name="Cherthala", code="SRTL", cat="NSG5", div="MAS", lat=10.8664, lng=77.8635),
        dict(name="Chirayinkil (FLAG", code="CRY", cat="NSG5S", div="SA", lat=12.6956, lng=79.3091),
        dict(name="Eraniel", code="ERL", cat="NSGS", div="CBE", lat=12.9097, lng=76.2793),
        dict(name="Haripad", code="HAD", cat="NSG5", div="PGT", lat=12.9039, lng=78.4761),
        dict(name="lrinjalakuda", code="WK", cat="NSG5S", div="TVC", lat=9.5177, lng=76.687),
        dict(name="Karunagapalli", code="KPY", cat="NSGS", div="MAS", lat=12.3724, lng=77.2015),
        dict(name="Kazhakuttom", code="KZK", cat="NSG5", div="SA", lat=11.7796, lng=76.7631),
        dict(name="Kulitturai", code="KZT", cat="NSG5", div="CBE", lat=9.607, lng=79.3624),
        dict(name="Mavelikara", code="MVLK", cat="NSG5", div="PGT", lat=11.9176, lng=78.2561),
        dict(name="Nagercoil Town", code="NJT", cat="NSGS", div="TVC", lat=9.5129, lng=79.9631),
        dict(name="Nanguneri", code="NNN", cat="NSGS", div="MAS", lat=8.329, lng=76.068),
        dict(name="Neyyatinkara", code="NYY", cat="NSG5", div="SA", lat=11.5624, lng=78.5267),
        dict(name="Parassala", code="PASA", cat="NSG5", div="CBE", lat=9.0316, lng=77.8717),
        dict(name="Paravur", code="PVU", cat="NSG5", div="PGT", lat=8.0528, lng=76.0413),
        dict(name="Piravam road", code="PVRD", cat="NSGS", div="TVC", lat=11.5441, lng=79.7177),
        dict(name="Sasthankotta", code="STKT", cat="NSG5", div="MAS", lat=12.5803, lng=78.5893),
        dict(name="Tripunittura", code="TRTR", cat="NSG5", div="SA", lat=10.0696, lng=77.4098),
        dict(name="Wadakancheri", code="WKI", cat="NSGS", div="CBE", lat=12.019, lng=76.2124),
        dict(name="", code="Ariyalur", cat="ALU", div="PGT", lat=8.1038, lng=76.1288),
        dict(name="Chidambaram", code="CDM", cat="NSG5", div="TVC", lat=8.3807, lng=77.695),
        dict(name="Cuddalore port jn.", code="CUPJ", cat="NSG5", div="MAS", lat=11.0026, lng=79.2131),
        dict(name="Karaikal", code="KIK", cat="NSGS", div="SA", lat=12.6088, lng=79.5697),
        dict(name="Lalgudi", code="LL", cat="NSGS5", div="CBE", lat=9.3146, lng=76.331),
        dict(name="Mannargudi", code="MQ", cat="NSG5", div="PGT", lat=11.8052, lng=76.3815),
        dict(name="Nagore", code="NCR", cat="NSG5", div="TVC", lat=12.7177, lng=76.1123),
        dict(name="Nidamangalam", code="NMJ", cat="NSGS", div="MAS", lat=11.1533, lng=77.0498),
        dict(name="Papanasam (FLAG", code="PML", cat="NSGS", div="SA", lat=8.6266, lng=79.051),
        dict(name="Sirkazhi", code="sY", cat="NSG5", div="CBE", lat=8.691, lng=79.7023),
        dict(name="Srirangam", code="SRGM", cat="NSG5S", div="PGT", lat=10.2243, lng=76.4506),
        dict(name="Tiruchchirappalli fort", code="TP", cat="NSGS", div="TVC", lat=9.6269, lng=76.2955),
        dict(name="Tirukkovilur", code="TRK", cat="NSG5", div="MAS", lat=8.9096, lng=78.441),
        dict(name="Tiruppadirippuliyur", code="TDPR", cat="NSG5", div="SA", lat=9.2758, lng=78.1231),
        dict(name="Tiruvannamalai", code="T™NM", cat="NSG5", div="CBE", lat=10.5399, lng=77.3508),
        dict(name="Tiruvarur jn.", code="TVR", cat="NSGS", div="PGT", lat=11.4334, lng=78.2439),
        dict(name="Tiruverumbur", code="TRB", cat="NSGS", div="TVC", lat=8.4502, lng=78.8382),
        dict(name="Velanganni", code="VLNK", cat="NSG5", div="MAS", lat=12.1183, lng=77.2445),
        dict(name="Vellore cantonment", code="VLR", cat="NSG5", div="SA", lat=9.7376, lng=78.1279),
        dict(name="Vriddhachalam jn.", code="vRi", cat="NSG5", div="CBE", lat=11.606, lng=79.7085),
        dict(name="", code="Ambasamudram", cat="ASD", div="PGT", lat=10.4486, lng=76.8593),
        dict(name="Devakottai road (FLAG", code="DKO.", cat="NSG5", div="TVC", lat=11.4216, lng=78.3416),
        dict(name="Kadayanallur", code="KDNL", cat="NSG5", div="MAS", lat=8.1038, lng=78.2295),
        dict(name="Kodaikkanal road", code="KQN", cat="NSG5S", div="SA", lat=11.4773, lng=76.2932),
        dict(name="Manamadurai jn", code="MNM", cat="NSGS", div="CBE", lat=8.7536, lng=77.4496),
        dict(name="Nazareth", code="NZT", cat="NSG5", div="PGT", lat=10.4789, lng=79.5523),
        dict(name="Oddanchatram", code="oDpc", cat="NSG5", div="TVC", lat=12.8264, lng=78.9829),
        dict(name="Paramakkudi", code="PMK", cat="NSG5", div="MAS", lat=12.7788, lng=79.9461),
        dict(name="Pudukkotai", code="PDKT", cat="NSGS", div="SA", lat=11.2775, lng=77.664),
        dict(name="Rajapalayam", code="RJPM", cat="NSGS", div="CBE", lat=11.1751, lng=79.8741),
        dict(name="Sankarankovil", code="SNKL", cat="NSG5", div="PGT", lat=10.8607, lng=79.3514),
        dict(name="Sattur", code="SRT", cat="NSG5", div="TVC", lat=12.8307, lng=76.4659),
        dict(name="Sengottai", code="SCT", cat="NSG5S", div="MAS", lat=8.8978, lng=77.3728),
        dict(name="Sholavandan", code="SDN", cat="NSGS", div="SA", lat=11.6898, lng=77.0051),
        dict(name="Sivaganga", code="SVGA", cat="NSG5", div="CBE", lat=10.4865, lng=77.0075),
        dict(name="Sivakasi", code="SVKS.", cat="NSG5S", div="PGT", lat=11.7178, lng=76.9122),
        dict(name="Srivilliputtur", code="SVPR", cat="NSGS", div="TVC", lat=12.6062, lng=78.6395),
        dict(name="Thirupparankundram", code="TDN", cat="NSG5", div="MAS", lat=11.6538, lng=79.9527),
        dict(name="Tirumangalam", code="TMQ", cat="NSG5", div="SA", lat=12.9219, lng=78.4697),
        dict(name="Tiruttangal (FLAG", code="TTL", cat="NSG5", div="CBE", lat=9.1151, lng=79.4941),
        dict(name="'Vanchi maniyachi", code="MEJ", cat="NSGS", div="PGT", lat=9.0512, lng=77.9246),
        dict(name="Anna nagar", code="ANNG", cat="NSG6", div="TVC", lat=12.7374, lng=76.9478),
        dict(name="Arambakkam", code="AKM", cat="NSG6", div="MAS", lat=8.873, lng=76.6152),
        dict(name="Chitteri", code="CTRE", cat="NSG6", div="SA", lat=8.7845, lng=76.8719),
        dict(name="Doravari chatram", code="DVR", cat="NSG6", div="CBE", lat=8.9751, lng=77.4574),
        dict(name="Elavur", code="ELR", cat="NSG6", div="PGT", lat=8.8833, lng=77.696),
        dict(name="Karunguzhi", code="KGZ", cat="NSG6", div="TVC", lat=9.52, lng=76.2804),
        dict(name="Kavanur", code="KVN", cat="NSG6", div="MAS", lat=11.5051, lng=77.9216),
        dict(name="Kettandapatti", code="KDY", cat="NSG6", div="SA", lat=8.4171, lng=79.6207),
        dict(name="Latteri", code="ul", cat="NSG6", div="CBE", lat=9.3574, lng=76.5614),
        dict(name="Maduranthagam", code="MMK", cat="NSG6", div="PGT", lat=8.9665, lng=78.3651),
        dict(name="Mailam", code="MTL", cat="NSG6", div="TVC", lat=8.0086, lng=76.0944),
        dict(name="Melpatti", code="MPI", cat="NSG6", div="MAS", lat=8.1912, lng=79.9058),
        dict(name="Mukundarayapuram", code="MCN", cat="NSG6", div="SA", lat=9.8819, lng=77.8173),
        dict(name="Mundiyambakkam", code="MYP.", cat="NSG6", div="CBE", lat=9.6373, lng=77.3281),
        dict(name="Nagari", code="NG", cat="NSG6", div="PGT", lat=11.6293, lng=78.4091),
        dict(name="Odur", code="ODUR", cat="NSG6", div="TVC", lat=10.3471, lng=78.5148),
        dict(name="Olakur", code="OLA", cat="NSG6", div="MAS", lat=10.3258, lng=79.7133),
        dict(name="Otivakkam", code="ov", cat="NSG6", div="SA", lat=9.7037, lng=76.9363),
        dict(name="Pachakuppam", code="PCKM", cat="NSG6", div="CBE", lat=12.7165, lng=76.3333),
        dict(name="Palur", code="PALR", cat="NSG6", div="PGT", lat=11.9494, lng=79.2482),
        dict(name="Pedapariya", code="PYA", cat="NSG6", div="TVC", lat=10.3116, lng=79.8119),
        dict(name="Perani", code="PEI", cat="NSG6", div="MAS", lat=8.083, lng=76.4008),
        dict(name="Polireddypalem", code="PEL", cat="NSG6", div="SA", lat=11.9069, lng=79.7404),
        dict(name="Ponpadi", code="Pol", cat="NSG6", div="CBE", lat=12.6186, lng=79.4786),
        dict(name="Pudi", code="PUDI", cat="NSG6", div="PGT", lat=10.0775, lng=79.7889),
        dict(name="Sevur", code="SVUR", cat="NSG6", div="TVC", lat=12.4785, lng=78.7967),
        dict(name="Tada", code="TADA", cat="NSG6", div="MAS", lat=8.4001, lng=78.7448),
        dict(name="Taduku", code="TDK", cat="NSG6", div="SA", lat=12.0083, lng=79.7385),
        dict(name="Thalangai", code="TUG", cat="NSG6", div="CBE", lat=8.2985, lng=78.0692),
        dict(name="Thiruvalam", code="THL", cat="NSG6", div="PGT", lat=10.5382, lng=78.3677),
        dict(name="Tirumalpur", code="TMLP", cat="NSG6", div="TVC", lat=8.2888, lng=78.159),
        dict(name="Tozhupedu", code="TZD", cat="NSG6", div="MAS", lat=8.6737, lng=79.1085),
        dict(name="\Valathoor", code="VLT", cat="NSG6", div="SA", lat=8.6361, lng=79.9369),
        dict(name="\Vepagunta", code="VGA", cat="NSG6", div="CBE", lat=9.2545, lng=79.5152),
        dict(name="Vikravandi", code="VVN", cat="NSG6", div="PGT", lat=12.8871, lng=79.3946),
        dict(name="Vinnamangalam", code="VGM", cat="NSG6", div="TVC", lat=9.1968, lng=78.6553),
        dict(name="'Walajabad", code="WJ", cat="NSG6", div="MAS", lat=10.7786, lng=76.0601),
        dict(name="Anangur", code="ANU", cat="NSG6", div="SA", lat=10.2937, lng=79.1585),
        dict(name="Buddireddippatti", code="BDY", cat="NSG6", div="CBE", lat=9.1382, lng=77.3138),
        dict(name="Cauvery", code="cv", cat="NSG6", div="PGT", lat=8.0735, lng=79.3585),
        dict(name="Chavadipalaiyam", code="cvD", cat="NSG6", div="TVC", lat=11.5107, lng=78.5887),
        dict(name="Danishpet", code="DSPT", cat="NSG6", div="MAS", lat=12.2284, lng=77.2237),
        dict(name="Dasampatti", code="DST", cat="NSG6", div="SA", lat=11.934, lng=77.4912),
        dict(name="Doddampatti", code="DPI", cat="NSG6", div="CBE", lat=11.8809, lng=76.3305),
        dict(name="Elamanur", code="EL", cat="NSG6", div="PGT", lat=8.8582, lng=76.8163),
        dict(name="Eriodu", code="EDU", cat="NSG6", div="TVC", lat=9.6269, lng=76.6034),
        dict(name="Ettapur road", code="ETP", cat="NSG6", div="MAS", lat=8.3816, lng=77.6061),
        dict(name="Ingur", code="IGR", cat="NSG6", div="SA", lat=10.472, lng=76.6476),
        dict(name="Kagankarai", code="KEY", cat="NSG6", div="CBE", lat=12.8648, lng=78.2692),
        dict(name="Kalangani", code="KLGN", cat="NSG6", div="PGT", lat=11.3678, lng=76.6606),
        dict(name="Karamadai", code="KAY", cat="NSG6", div="TVC", lat=8.0894, lng=79.574),
        dict(name="Karuppur", code="KPPR", cat="NSG6", div="MAS", lat=11.9836, lng=78.5471),
        dict(name="Ketti", code="KXT", cat="NSG6", div="SA", lat=10.0341, lng=76.4104),
        dict(name="Kodumudi", code="KMD.", cat="NSG6", div="CBE", lat=12.8884, lng=76.3939),
        dict(name="Lalapet", code="LP", cat="NSG6", div="PGT", lat=8.8854, lng=77.7913),
        dict(name="Lokur", code="LCR", cat="NSG6", div="TVC", lat=8.8485, lng=79.226),
        dict(name="Lovedale", code="LOV", cat="NSG6", div="MAS", lat=12.212, lng=78.6655),
        dict(name="Magudanchavadi", code="DC", cat="NSG6", div="SA", lat=12.7133, lng=76.6636),
        dict(name="Mahadanapuram", code="MMH", cat="NSG6", div="CBE", lat=11.8204, lng=79.1374),
        dict(name="Mallur", code="MALR", cat="NSG6", div="PGT", lat=10.7842, lng=76.3996),
        dict(name="Mavelipalaiyam", code="MVPM", cat="NSG6", div="TVC", lat=11.4726, lng=76.7984),
        dict(name="Mayanur", code="MYU", cat="NSG6", div="MAS", lat=10.4849, lng=76.7899),
        dict(name="Mecheri road", code="MCRD", cat="NSG6", div="SA", lat=8.8439, lng=76.5865),
        dict(name="Metturdam", code="MTDM", cat="NSG6", div="CBE", lat=11.2518, lng=79.1346),
        dict(name="Minnampalli", code="MPLI", cat="NSG6", div="PGT", lat=12.5618, lng=78.5608),
        dict(name="Mohanur", code="MONR", cat="NSG6", div="TVC", lat=9.5624, lng=77.5354),
        dict(name="Mukhasa parur", code="MKSP-", cat="NSG6", div="MAS", lat=10.0237, lng=76.1095),
        dict(name="Murthipalaiyam", code="MPLM", cat="NSG6", div="SA", lat=8.6243, lng=77.1922),
        dict(name="Muttarasanallur", code="MTNL", cat="NSG6", div="CBE", lat=12.3542, lng=79.1368),
        dict(name="Omalur", code="OML.", cat="NSG6", div="PGT", lat=12.8166, lng=78.5795),
        dict(name="Palaiyam", code="PALM", cat="NSG6", div="TVC", lat=12.5456, lng=78.7269),
        dict(name="Pasur", code="PAS", cat="NSG6", div="MAS", lat=11.2485, lng=78.5278),
        dict(name="Peddanayakkanpalaiyam (FLAG", code="PDKM", cat="NSG6", div="SA", lat=10.7314, lng=77.4237),
        dict(name="Perugamani", code="PGN", cat="NSG6", div="CBE", lat=9.274, lng=76.4414),
        dict(name="Perundurai", code="PY", cat="NSG6", div="PGT", lat=10.2471, lng=78.9282),
        dict(name="Pettaivaytalai", code="PLI", cat="NSG6", div="TVC", lat=8.1974, lng=77.0932),
        dict(name="Pilamedu", code="PLMD", cat="NSG6", div="MAS", lat=8.9936, lng=78.9607),
        dict(name="Pukkiravari", code="PRV", cat="NSG6", div="SA", lat=10.9156, lng=79.809),
        dict(name="Rasipuram", code="RASP", cat="NSG6", div="CBE", lat=10.0995, lng=78.7306),
        dict(name="Salem market", code="SAMT", cat="NSG6", div="PGT", lat=11.1047, lng=77.8696),
        dict(name="Sithalavai (FLAG", code="SEV", cat="NSG6", div="TVC", lat=8.6258, lng=76.8986),
        dict(name="Somanur", code="SNO.", cat="NSG6", div="MAS", lat=10.9412, lng=77.2368),
        dict(name="Sulur road", code="SUU", cat="NSG6", div="SA", lat=9.8332, lng=78.8924),
        dict(name="Tinnappatti", code="TNT", cat="NSG6", div="CBE", lat=12.4525, lng=78.7428),
        dict(name="Totiyapalaiyam", code="TPM", cat="NSG6", div="PGT", lat=8.6151, lng=78.6232),
        dict(name="Unjalur", code="URL", cat="NSG6", div="TVC", lat=12.9894, lng=76.4147),
        dict(name="Uttukuli", code="UKL", cat="NSG6", div="MAS", lat=8.0989, lng=79.3527),
        dict(name="Vanjipalayam", code="VNJ", cat="NSG6", div="SA", lat=10.7817, lng=78.9796),
        dict(name="\Veerarakiyam", code="VRQ", cat="NSG6", div="CBE", lat=8.6622, lng=77.4367),
        dict(name="Velliyanai", code="VEI", cat="NSG6", div="PGT", lat=10.6073, lng=77.8049),
        dict(name="Vijayamangalam", code="VZ", cat="NSG6", div="TVC", lat=9.8584, lng=79.8759),
        dict(name="", code="Virapandy road", cat="VRPD", div="MAS", lat=11.9546, lng=77.3186),
        dict(name="Wellington", code="WEL", cat="NSG6", div="SA", lat=11.9175, lng=77.0294),
        dict(name="Elattur", code="ETR", cat="NSG6", div="CBE", lat=10.7044, lng=77.9558),
        dict(name="Etakkot", code="ETK", cat="NSG6", div="PGT", lat=12.4659, lng=77.5837),
        dict(name="Ettimadai", code="ETMD", cat="NSG6", div="TVC", lat=8.1704, lng=78.1791),
        dict(name="Jokatte", code="JOKT", cat="NSG6", div="MAS", lat=9.6686, lng=77.2028),
        dict(name="Kadalundi", code="KN", cat="NSG6", div="SA", lat=10.5009, lng=77.0417),
        dict(name="Kallayi", code="KUL", cat="NSG6", div="CBE", lat=10.3642, lng=78.4375),
        dict(name="Kanjikode", code="KJKD.", cat="NSG6", div="PGT", lat=10.5607, lng=78.355),
        dict(name="Kannur south", code="cs", cat="NSG6", div="TVC", lat=12.8865, lng=77.9402),
        dict(name="Karakad", code="KRKD", cat="NSG6", div="MAS", lat=9.2391, lng=79.7281),
        dict(name="Kinattukkadavu", code="CNV", cat="NSG6", div="SA", lat=12.4134, lng=76.5018),
        dict(name="Kollengode", code="KLGD", cat="NSG6", div="CBE", lat=9.6733, lng=76.1673),
        dict(name="Kotikulam", code="KQK", cat="NSG6", div="PGT", lat=11.8339, lng=78.3598),
        dict(name="Lakkiti", code="LDY", cat="NSG6", div="TVC", lat=12.2655, lng=78.9584),
        dict(name="Madukarai", code="MDKI", cat="NSG6", div="MAS", lat=11.2572, lng=79.7975),
        dict(name="Manjeshwar", code="MJS.", cat="NSG6", div="SA", lat=11.3981, lng=79.4257),
        dict(name="Mannanur", code="MNUR", cat="NSG6", div="CBE", lat=11.203, lng=79.9994),
        dict(name="Minatchipuram", code="MXM", cat="NSG6", div="PGT", lat=10.1939, lng=78.5205),
        dict(name="Muthalamada", code="MMDA", cat="NSG6", div="TVC", lat=11.4577, lng=76.4268),
        dict(name="Pallipuram", code="PUM", cat="NSG6", div="MAS", lat=11.3262, lng=77.5586),
        dict(name="Parli", code="PLL", cat="NSG6", div="SA", lat=11.4793, lng=79.7082),
        dict(name="Payyoli (FLAG", code="PYOL", cat="NSG6", div="CBE", lat=10.6506, lng=79.7614),
        dict(name="Pudunagaram", code="PDGM", cat="NSG6", div="PGT", lat=12.8096, lng=79.1179),
        dict(name="Tikkotti", code="TKT", cat="NSG6", div="TVC", lat=12.9071, lng=79.0514),
        dict(name="Tirunnavaya", code="TUA", cat="NSG6", div="MAS", lat=10.1743, lng=77.0508),
        dict(name="Trikarpur (FLAG", code="TKQ", cat="NSG6", div="SA", lat=9.1998, lng=77.935),
        dict(name="Uppala", code="UAA", cat="NSG6", div="CBE", lat=10.6134, lng=78.4955),
        dict(name="Valapattanam", code="VAPM", cat="NSG6", div="PGT", lat=10.4227, lng=78.0935),
        dict(name="Vallikunnu (FLAG", code="Vu", cat="NSG6", div="TVC", lat=10.1589, lng=76.0014),
        dict(name="Walayar", code="WRA", cat="NSG6", div="MAS", lat=11.5313, lng=78.5643),
        dict(name="West Hill", code="WH", cat="NSG6", div="SA", lat=10.6288, lng=76.0071),
        dict(name="", code="Aralvaymoli", cat="AAY", div="CBE", lat=11.8895, lng=76.8269),
        dict(name="Cheppad", code="CHPD", cat="NSG6", div="PGT", lat=11.3245, lng=77.1916),
        dict(name="Chingavanam", code="CGV", cat="NSG6", div="TVC", lat=9.8997, lng=79.3032),
        dict(name="Edavai (FLAG", code="EVA", cat="NSG6", div="MAS", lat=8.7306, lng=79.1814),
        dict(name="Ettumanur", code="ETM", cat="NSG6", div="SA", lat=10.9746, lng=79.9811),
        dict(name="Idappalli", code="IPL.", cat="NSG6", div="CBE", lat=10.2155, lng=78.9253),
        dict(name="Kadakavur", code="KVU", cat="NSG6", div="PGT", lat=9.5968, lng=79.1062),
        dict(name="Kalamasseri", code="KLMR", cat="NSG6", div="TVC", lat=8.8316, lng=79.0414),
        dict(name="Kaniapuram (FLAG", code="KXP.", cat="NSG6", div="MAS", lat=12.8324, lng=79.6168),
        dict(name="Karukutty", code="KUC.", cat="NSG6", div="SA", lat=10.2225, lng=78.3554),
        dict(name="Kochi harbour terminus", code="CHTS", cat="NSG6", div="CBE", lat=12.0879, lng=76.358),
        dict(name="Kumbalam", code="KUMM", cat="NSG6", div="PGT", lat=9.65, lng=76.6316),
        dict(name="Kuruppantara", code="KRPP-", cat="NSG6", div="TVC", lat=10.2998, lng=79.7971),
        dict(name="Mararikulam", code="MAKM", cat="NSG6", div="MAS", lat=11.732, lng=77.2385),
        dict(name="Mayyanad", code="MYY", cat="NSG6", div="SA", lat=10.9183, lng=78.3433),
        dict(name="Mulagunnathukavu", code="MGK", cat="NSG6", div="CBE", lat=9.1294, lng=78.4859),
        dict(name="Mulanturutti", code="MNTT", cat="NSG6", div="PGT", lat=10.0365, lng=76.661),
        dict(name="Murukkampuzha", code="MQU", cat="NSG6", div="TVC", lat=10.8342, lng=77.2579),
        dict(name="Nemam", code="NEM", cat="NSG6", div="MAS", lat=12.8506, lng=79.5883),
        dict(name="North panakudi", code="NPK", cat="NSG6", div="SA", lat=8.1252, lng=76.1132),
        dict(name="Ochira", code="OCR", cat="NSG6", div="CBE", lat=9.8795, lng=79.4347),
        dict(name="Ollur", code="OLR", cat="NSG6", div="PGT", lat=9.0769, lng=78.0877),
        dict(name="Perinad", code="PRND", cat="NSG6", div="TVC", lat=8.6106, lng=76.5154),
        dict(name="Pudukad", code="PUK", cat="NSG6", div="MAS", lat=8.8121, lng=79.8585),
        dict(name="Punkunnam", code="PNQ", cat="NSG6", div="SA", lat=10.7785, lng=79.7231),
        dict(name="Sengulam", code="SGLM", cat="NSG6", div="CBE", lat=12.1539, lng=79.9235),
        dict(name="Tiruvananthapuram pettah (FLAG", code="TVP", cat="NSG6", div="PGT", lat=11.9459, lng=77.6177),
        dict(name="Turavur", code="TUVR", cat="NSG6", div="TVC", lat=8.3613, lng=78.9368),
        dict(name="Vaikam road", code="VARD", cat="NSG6", div="MAS", lat=8.3463, lng=76.3825),
        dict(name="VallathoInagar", code="VTK", cat="NSG6", div="SA", lat=11.9345, lng=79.8085),
        dict(name="Adirampattinam", code="AMM", cat="NSG6", div="CBE", lat=12.2257, lng=79.1581),
        dict(name="Aduturai", code="ADT", cat="NSG6", div="PGT", lat=10.8816, lng=77.5859),
        dict(name="", code="Agaram sibbandi", cat="AGM", div="TVC", lat=9.6194, lng=76.3746),
        dict(name="Agastiampalli", code="AGX", cat="NSG6", div="MAS", lat=12.2285, lng=78.9116),
        dict(name="", code="Alakkudi", cat="ALK", div="SA", lat=12.9054, lng=79.7178),
        dict(name="", code="Alapakam", cat="ALP", div="CBE", lat=11.105, lng=77.8358),
        dict(name="", code="Anandatandavapuram", cat="ANP.", div="PGT", lat=9.3684, lng=76.819),
        dict(name="", code="Arantangi", cat="ATQ", div="TVC", lat=12.5313, lng=78.9709),
        dict(name="Arni road", code="ARV", cat="NSG6", div="MAS", lat=10.4996, lng=77.7278),
        dict(name="", code="Ayingudi", cat="AY!", div="SA", lat=11.6697, lng=76.783),
        dict(name="Budalur", code="BAL", cat="NSG6", div="CBE", lat=8.0944, lng=79.0202),
        dict(name="Chinnababu samudram", code="CBU", cat="NSG6", div="PGT", lat=12.5171, lng=77.6798),
        dict(name="Ichchangadu", code="ICG", cat="NSG6", div="TVC", lat=8.6896, lng=77.0239),
        dict(name="Kallagam", code="KLGM", cat="NSG6", div="MAS", lat=12.941, lng=77.1433),
        dict(name="Kallakkudi palanganatham", code="KKPM", cat="NSG6", div="SA", lat=11.1645, lng=76.6092),
        dict(name="Kandambakkam", code="KDMD", cat="NSG6", div="CBE", lat=11.2102, lng=76.6287),
        dict(name="Kaniyambadi", code="KNB", cat="NSG6", div="PGT", lat=9.3694, lng=78.6196),
        dict(name="Kannamangalam", code="KMM", cat="NSG6", div="TVC", lat=8.5283, lng=77.8236),
        dict(name="Kille", code="Kil", cat="NSG6", div="MAS", lat=11.5066, lng=78.1736),
        dict(name="Kizhvelur", code="KVL.", cat="NSG6", div="SA", lat=12.9717, lng=78.4292),
        dict(name="Kollidam", code="CLN", cat="NSG6", div="CBE", lat=8.4599, lng=79.7564),
        dict(name="Koradacheri", code="KDE", cat="NSG6", div="PGT", lat=8.5955, lng=76.6844),
        dict(name="Kulikarai", code="KU", cat="NSG6", div="TVC", lat=12.9074, lng=76.5255),
        dict(name="Kurinjipadi", code="KJPD", cat="NSG6", div="MAS", lat=11.5774, lng=76.2408),
        dict(name="Kutralam", code="KTM", cat="NSG6", div="SA", lat=9.2478, lng=77.7602),
        dict(name="Mambalapattu", code="MMP", cat="NSG6", div="CBE", lat=10.997, lng=78.5399),
        dict(name="Mathur", code="MTUR", cat="NSG6", div="PGT", lat=11.942, lng=79.1513),
        dict(name="Melpattambakkam", code="MBU", cat="NSG6", div="TVC", lat=11.2401, lng=78.3944),
        dict(name="Nannilam", code="NNM", cat="NSG6", div="MAS", lat=11.2942, lng=76.3856),
        dict(name="Nellikuppam", code="NPM", cat="NSG6", div="SA", lat=9.3317, lng=76.8654),
        dict(name="Neyveli", code="NVL.", cat="NSG6", div="CBE", lat=8.7994, lng=76.5366),
        dict(name="Ottakovil", code="OTK", cat="NSG6", div="PGT", lat=12.0158, lng=78.3052),
        dict(name="Pandaravadai", code="PDV", cat="NSG6", div="TVC", lat=8.4837, lng=78.8057),
        dict(name="Panruti", code="PRT", cat="NSG6", div="MAS", lat=10.1487, lng=78.0837),
        dict(name="Parikkal", code="PRKL", cat="NSG6", div="SA", lat=11.7007, lng=79.7653),
        dict(name="Pattukottai", code="PKT", cat="NSG6", div="CBE", lat=9.569, lng=76.4395),
        dict(name="Pennadam (FLAG", code="PNDM", cat="NSG6", div="PGT", lat=9.3584, lng=78.0059),
        dict(name="Peralam .", code="PEM", cat="NSG6", div="TVC", lat=9.5644, lng=79.1797),
        dict(name="Peravuruni", code="PVI", cat="NSG6", div="MAS", lat=11.2171, lng=79.4775),
        dict(name="Periyakottai", code="PYK", cat="NSG6", div="SA", lat=10.2949, lng=77.1617),
        dict(name="Polur", code="PRL", cat="NSG6", div="CBE", lat=8.0457, lng=78.7259),
        dict(name="Ponmalai (golden rock", code="GOC", cat="NSG6", div="PGT", lat=8.3166, lng=79.2462),
        dict(name="Puduchattiram", code="PUC", cat="NSG6", div="TVC", lat=11.6199, lng=79.2879),
        dict(name="Pullambadi", code="PMB", cat="NSG6", div="MAS", lat=11.5429, lng=78.8509),
        dict(name="Puvanur", code="PVN", cat="NSG6", div="SA", lat=9.8395, lng=79.2351),
        dict(name="Saliyamangalam", code="SMM", cat="NSG6", div="CBE", lat=12.8981, lng=78.9328),
        dict(name="Sendurai", code="SNDI", cat="NSG6", div="PGT", lat=10.2945, lng=79.0242),
        dict(name="Serndanur", code="SXR", cat="NSG6", div="TVC", lat=11.0267, lng=79.0336),
        dict(name="Sillakkudi", code="SLTH", cat="NSG6", div="MAS", lat=11.8416, lng=77.9887),
        dict(name="Solagampatti", code="SGM", cat="NSG6", div="SA", lat=8.141, lng=77.2723),
        dict(name="Sundaraperumal Koil", code="SPL", cat="NSG6", div="CBE", lat=9.2937, lng=77.735),
        dict(name="Talanallur", code="TLNR", cat="NSG6", div="PGT", lat=8.4573, lng=76.285),
        dict(name="Tandarai", code="TNI", cat="NSG6", div="TVC", lat=11.6383, lng=78.7781),
        dict(name="Thiruthuraiyur", code="TUY", cat="NSG6", div="MAS", lat=11.665, lng=79.0316),
        dict(name="Tillaivilagam", code="TAM", cat="NSG6", div="SA", lat=9.0153, lng=79.9176),
        dict(name="Tiruchchirappalli town", code="TPTN", cat="NSG6", div="CBE", lat=11.2043, lng=77.7169),
        dict(name="Tirunelikaval", code="TNK", cat="NSG6", div="PGT", lat=9.4425, lng=76.7089),
        dict(name="Tiruturaipundi jn.", code="TTP", cat="NSG6", div="TVC", lat=12.7551, lng=79.0729),
        dict(name="Tiruvennainallur road", code="TVNL", cat="NSG6", div="MAS", lat=12.8156, lng=77.5606),
        dict(name="Titte", code="T", cat="NSG6", div="SA", lat=12.5929, lng=79.0538),
        dict(name="Turinjapuram", code="TJM", cat="NSG6", div="CBE", lat=12.5871, lng=77.3435),
        dict(name="Ulundurpet", code="ULU", cat="NSG6", div="PGT", lat=10.1574, lng=77.6257),
        dict(name="Uttangal mangalam", code="UMG", cat="NSG6", div="TVC", lat=10.9894, lng=76.5189),
        dict(name="Vadalur", code="VLU", cat="NSG6", div="MAS", lat=11.9783, lng=77.0134),
        dict(name="Vaithisvarankoil", code="VDL.", cat="NSG6", div="SA", lat=10.3049, lng=77.6468),
        dict(name="Valadi", code="VLDE", cat="NSG6", div="CBE", lat=8.5708, lng=77.8186),
        dict(name="\Venkatesapuram", code="VKM", cat="NSG6", div="PGT", lat=11.9858, lng=77.8657),
        dict(name="", code="Akkaraippatti", cat="API", div="TVC", lat=12.7244, lng=78.8587),
        dict(name="Alwar tirunagari (FLAG", code="AWT", cat="NSG6", div="MAS", lat=12.7755, lng=77.343),
        dict(name="", code="Ambaturai", cat="ABI", div="SA", lat=10.8738, lng=79.8493),
        dict(name="Andipatti", code="ADPT", cat="NSG6", div="CBE", lat=10.845, lng=76.6834),
        dict(name="", code="Arumuganeri", cat="ANY", div="PGT", lat=10.5412, lng=76.9586),
        dict(name="", code="Aruppukkottai", cat="APK", div="TVC", lat=10.4281, lng=76.0159),
        dict(name="Auvaneeswarem", code="AVS", cat="NSG6", div="MAS", lat=8.5231, lng=79.4906),
        dict(name="", code="Ayyalur", cat="AYR", div="SA", lat=8.5453, lng=79.7549),
        dict(name="Bhagavathipuram", code="BJM", cat="NSG6", div="CBE", lat=8.208, lng=79.0848),
        dict(name="Bodinayakkanur", code="BDNK", cat="NSG6", div="PGT", lat=12.5255, lng=77.691),
        dict(name="Chatrappatti", code="CHPT", cat="NSG6", div="TVC", lat=12.6479, lng=78.307),
        dict(name="Cheran mahadevi", code="SMD.", cat="NSG6", div="MAS", lat=12.9374, lng=76.7819),
        dict(name="Chettinad", code="CTND", cat="NSG6", div="SA", lat=12.6683, lng=76.4864),
        dict(name="Edamann", code="EDN", cat="NSG6", div="CBE", lat=9.2263, lng=78.4377),
        dict(name="Ezhukone (FLAG", code="EKN", cat="NSG6", div="PGT", lat=9.3409, lng=76.4033),
        dict(name="Gangaikondan", code="GDN", cat="NSG6", div="TVC", lat=11.0975, lng=78.3229),
        dict(name="Gomangalam", code="GMGM", cat="NSG6", div="MAS", lat=8.8922, lng=79.8799),
        dict(name="Kachchanavilai (FLAG", code="KCHV", cat="NSG6", div="SA", lat=10.4649, lng=78.0695),
        dict(name="Kadambur", code="KDU", cat="NSG6", div="CBE", lat=11.141, lng=78.7572),
        dict(name="Kallal", code="KAL", cat="NSG6", div="PGT", lat=8.633, lng=76.5574),
        dict(name="Kallidaikurichi (FLAG", code="KIC.", cat="NSG6", div="TVC", lat=8.922, lng=77.9189),
        dict(name="Kalligudi", code="KGD", cat="NSG6", div="MAS", lat=11.744, lng=76.0054),
        dict(name="Kalpattichatram", code="KFC", cat="NSG6", div="SA", lat=12.0987, lng=78.143),
        dict(name="Kayalpattinam (FLAG", code="KZY", cat="NSG6", div="CBE", lat=11.6757, lng=77.9648),
        dict(name="Keeranur", code="KRUR", cat="NSG6", div="PGT", lat=8.5087, lng=76.6774),
        dict(name="Kilakadaiyam", code="KKY", cat="NSG6", div="TVC", lat=9.6064, lng=78.0601),
        dict(name="Kilikollur", code="KLQ", cat="NSG6", div="MAS", lat=12.9111, lng=78.3958),
        dict(name="Kizhapuliyur (FLAG", code="KYZ", cat="NSG6", div="SA", lat=8.376, lng=79.5713),
        dict(name="Kolathur", code="KLS", cat="NSG6", div="CBE", lat=9.2817, lng=79.8879),
        dict(name="Kottarakara", code="KKZ", cat="NSG6", div="PGT", lat=9.2484, lng=77.6069),
        dict(name="Kudalnagar", code="KON", cat="NSG6", div="TVC", lat=8.846, lng=78.5102),
        dict(name="Kumaramangalam", code="KRMG", cat="NSG6", div="MAS", lat=8.5358, lng=77.7),
        dict(name="Kundara", code="KUV", cat="NSG6", div="SA", lat=11.295, lng=79.2571),
        dict(name="Kurumbur (FLAG", code="KZB", cat="NSG6", div="CBE", lat=11.9566, lng=79.5294),
        dict(name="Madurai east (FLAG", code="MES", cat="NSG6", div="PGT", lat=10.729, lng=79.2694),
        dict(name="Maivadi road", code="MVRD.", cat="NSG6", div="TVC", lat=12.3505, lng=77.3333),
        dict(name="Manaparai", code="MPA", cat="NSG6", div="MAS", lat=10.8241, lng=77.367),
        dict(name="Mandapam", code="MMM", cat="NSG6", div="SA", lat=12.9761, lng=76.1758),
        dict(name="Melakkonnakkulam", code="MEKM", cat="NSG6", div="CBE", lat=11.3987, lng=78.163),
        dict(name="Mettur (FLAG", code="MTE", cat="NSG6", div="PGT", lat=9.7621, lng=77.3821),
        dict(name="Milavittan", code="MVN", cat="NSG6", div="TVC", lat=9.3425, lng=77.7969),
        dict(name="Narikkudi", code="NKK", cat="NSG6", div="MAS", lat=10.3183, lng=78.7875),
        dict(name="New Aryankavu", code="AYVN", cat="NSG6", div="SA", lat=9.4553, lng=76.395),
        dict(name="Palayamkottai (FLAG", code="PCO", cat="NSG6", div="CBE", lat=12.3085, lng=77.0277),
        dict(name="Pambakovil shandy", code="PBKS", cat="NSG6", div="PGT", lat=8.2736, lng=79.2083),
        dict(name="Pamban", code="PBM", cat="NSG6", div="TVC", lat=12.4573, lng=77.5103),
        dict(name="Panangudi", code="PNGI", cat="NSG6", div="MAS", lat=10.068, lng=77.6527),
        dict(name="Pavurchatram", code="PCM", cat="NSG6", div="SA", lat=12.9268, lng=76.9263),
        dict(name="Pettai (FLAG", code="PEA", cat="NSG6", div="CBE", lat=8.1797, lng=76.1188),
        dict(name="Punalur", code="PUU", cat="NSG6", div="PGT", lat=11.0896, lng=78.9136),
        dict(name="Punggudi", code="PUG", cat="NSG6", div="TVC", lat=12.9431, lng=76.3022),
        dict(name="Pushpattur", code="PPTR", cat="NSG6", div="MAS", lat=9.7835, lng=76.0238),
        dict(name="Ravanasamudram (FLAG", code="RVS", cat="NSG6", div="SA", lat=8.4029, lng=79.8284),
        dict(name="Samayanallur", code="SER", cat="NSG6", div="CBE", lat=10.0964, lng=76.6381),
        dict(name="Sattirakkudi", code="saQD", cat="NSG6", div="PGT", lat=9.4101, lng=76.9295),
        dict(name="Seydunganallur", code="SDNR", cat="NSG6", div="TVC", lat=12.5745, lng=79.2484),
        dict(name="Silaiman", code="ILA", cat="NSG6", div="MAS", lat=9.286, lng=76.9272),
        dict(name="Srivaikuntam", code="SVV", cat="NSG6", div="SA", lat=11.4971, lng=79.0911),
        dict(name="Sudiyur", code="SUX", cat="NSG6", div="CBE", lat=11.5514, lng=78.6898),
        dict(name="Talaiyuthu", code="TAY", cat="NSG6", div="PGT", lat=8.9273, lng=78.6171),
        dict(name="Tamaraipadi", code="TMP.", cat="NSG6", div="TVC", lat=11.935, lng=78.227),
        dict(name="Tattaparai", code="TIP", cat="NSG6", div="MAS", lat=9.4488, lng=78.9969),
        dict(name="Teni", code="TENI", cat="NSG6", div="SA", lat=8.9225, lng=78.3843),
        dict(name="Tenmalai", code="TML", cat="NSG6", div="CBE", lat=9.6143, lng=79.4383),
        dict(name="Thathankulam (FLAG", code="TTQ", cat="NSG6", div="PGT", lat=11.0031, lng=76.3326),
        dict(name="Tiruchchuli", code="TCH", cat="NSG6", div="TVC", lat=10.2466, lng=76.7242),
        dict(name="Tirumayam", code="TYM", cat="NSG6", div="MAS", lat=8.2147, lng=77.9608),
        dict(name="Tirunelveli town", code="TYT", cat="NSG6", div="SA", lat=8.5428, lng=78.0144),
        dict(name="Tiruppachetti", code="TPC", cat="NSG6", div="CBE", lat=12.1667, lng=79.729),
        dict(name="Tiruppuvanam", code="TVN", cat="NSG6", div="PGT", lat=11.9787, lng=76.4359),
        dict(name="Tulukapatti", code="TY", cat="NSG6", div="TVC", lat=10.9431, lng=79.6676),
        dict(name="Uchippuli", code="ucP.", cat="NSG6", div="MAS", lat=12.2726, lng=76.8742),
        dict(name="Udumalaippettai", code="UDT", cat="NSG6", div="SA", lat=10.3866, lng=77.7814),
        dict(name="Usilampatti", code="USLP", cat="NSG6", div="CBE", lat=12.0671, lng=77.3154),
        dict(name="Vadamadurai", code="VDM", cat="NSG6", div="PGT", lat=9.585, lng=76.3655),
        dict(name="Vadipatti", code="VDP", cat="NSG6", div="TVC", lat=8.2525, lng=77.8994),
        dict(name="Vaiyampatti", code="VPJ", cat="NSG6", div="MAS", lat=11.7664, lng=78.9192),
        dict(name="Vellanur", code="VEL", cat="NSG6", div="SA", lat=9.6799, lng=79.4774),
        dict(name="Chennai Beach", code="MSB", cat="SG1", div="CBE", lat=12.0694, lng=79.3502),
        dict(name="Guindy", code="GDY", cat="SG2", div="PGT", lat=8.4225, lng=77.2626),
        dict(name="Pazhavanthangal (FLAG", code="PZA", cat="SG2", div="TVC", lat=8.7042, lng=79.9741),
        dict(name="Velacheri", code="VLCY", cat="SG2", div="MAS", lat=11.8667, lng=78.4563),
        dict(name="Ambattur", code="ABU", cat="SG3", div="SA", lat=11.8034, lng=77.8729),
        dict(name="Annanur (HALT", code="ANNR", cat="SG3", div="CBE", lat=9.5208, lng=77.3846),
        dict(name="Anuppampattu (FLAG", code="APB", cat="SG3", div="PGT", lat=9.8982, lng=79.5393),
        dict(name="Atthipattu (FLAG", code="AIP.", cat="SG3", div="TVC", lat=10.8018, lng=79.3189),
        dict(name="", code="Attipattupudunagar (HALT)", cat="AIPP", div="MAS", lat=8.791, lng=77.3859),
        dict(name="Basin bridge jn", code="BBQ", cat="SG3", div="SA", lat=9.1877, lng=79.7658),
        dict(name="Chennai Chetpet (FLAG", code="MSC.", cat="SG3", div="CBE", lat=11.042, lng=78.999),
        dict(name="Chennai fort (FLAG", code="MSF", cat="SG3", div="PGT", lat=11.6564, lng=76.5714),
        dict(name="Chennai park", code="MPK", cat="SG3", div="TVC", lat=8.7922, lng=78.0687),
        dict(name="Chepauk", code="MCPK", cat="SG3", div="MAS", lat=8.6333, lng=76.9725),
        dict(name="Chintadripet", code="MCPT", cat="SG3", div="SA", lat=10.3836, lng=76.6734),
        dict(name="Chrompet (FLAG", code="CMP", cat="SG3", div="CBE", lat=10.716, lng=79.4494),
        dict(name="Egattur (HALT", code="EGT", cat="SG3", div="PGT", lat=11.7911, lng=78.6925),
        dict(name="Ennore", code="ENR", cat="SG3", div="TVC", lat=9.7016, lng=77.9551),
        dict(name="Greenways road (FLAG", code="GWYR", cat="SG3", div="MAS", lat=8.7223, lng=77.1093),
        dict(name="Gummidipundi", code="GPD", cat="SG3", div="SA", lat=8.9253, lng=79.5035),
        dict(name="Hindu college (HALT", code="HC", cat="SG3", div="CBE", lat=12.9143, lng=77.2517),
        dict(name="Indiranagar (FLAG", code="INDR", cat="SG3", div="PGT", lat=9.4051, lng=79.0719),
        dict(name="Kadambattur", code="KBT", cat="SG3", div="TVC", lat=8.039, lng=79.0435),
        dict(name="Kasturibanagar (FLAG", code="KTBR", cat="SG3", div="MAS", lat=8.8052, lng=79.3783),
        dict(name="Kathivakkam (FLAG", code="KAVM", cat="SG3", div="SA", lat=11.4641, lng=76.3013),
        dict(name="Kavaraipettai", code="KVP.", cat="SG3", div="CBE", lat=10.4226, lng=77.3502),
        dict(name="Kodambakkam", code="MKK", cat="SG3", div="PGT", lat=12.6707, lng=76.0315),
        dict(name="Korattur (FLAG", code="KOTR", cat="SG3", div="TVC", lat=10.7408, lng=79.8341),
        dict(name="Korukkupet", code="KOK", cat="SG3", div="MAS", lat=9.5313, lng=76.426),
        dict(name="Kotturpuram (FLAG", code="KTPM", cat="SG3", div="SA", lat=9.0289, lng=78.2365),
        dict(name="Light house (FLAG", code="MLHS.", cat="SG3", div="CBE", lat=9.9561, lng=77.5345),
        dict(name="Manavur (FLAG", code="MAF", cat="SG3", div="PGT", lat=10.0618, lng=79.5731),
        dict(name="Mandaiveli (FLAG", code="MNDY", cat="SG3", div="TVC", lat=11.823, lng=78.805),
        dict(name="Meenambakkam", code="MN", cat="SG3", div="MAS", lat=8.7592, lng=76.2327),
        dict(name="Minjur", code="MJR", cat="SG3", div="SA", lat=10.2111, lng=78.4761),
        dict(name="Moore Market Complex", code="MASS.", cat="SG3", div="CBE", lat=12.7464, lng=77.8998),
        dict(name="Mosur (HALT", code="MSU", cat="SG3", div="PGT", lat=9.8851, lng=79.6336),
        dict(name="Mundakakanni AmmanKoil", code="MKAK", cat="SG3", div="TVC", lat=10.3955, lng=79.3721),
        dict(name="Nandiyambakkam (HALT", code="NPKM", cat="SG3", div="MAS", lat=8.5438, lng=77.1799),
        dict(name="Nemilicherry (HALT", code="NEC", cat="SG3", div="SA", lat=11.0324, lng=78.6879),
        dict(name="Nungambakkam (FLAG", code="NBK", cat="SG3", div="CBE", lat=12.4114, lng=79.9215),
        dict(name="Pallavaram", code="PV", cat="SG3", div="PGT", lat=10.8102, lng=77.027),
        dict(name="Park town (FLAG", code="MPKT", cat="SG3", div="TVC", lat=9.308, lng=76.5521),
        dict(name="Pattabiram (FLAG", code="PAB", cat="SG3", div="MAS", lat=11.1853, lng=76.1329),
        dict(name="Pattabiram E-Depot", code="PRES", cat="SG3", div="SA", lat=9.096, lng=77.5789),
        dict(name="Pattabiram military siding (FLAG", code="PTMS", cat="SG3", div="CBE", lat=9.9024, lng=76.0954),
        dict(name="Pattravakkam (FLAG", code="PVM", cat="SG3", div="PGT", lat=12.1694, lng=76.4788),
        dict(name="Perambur carriage works (FLAG", code="PCW", cat="SG3", div="TVC", lat=10.2217, lng=77.8858),
        dict(name="Perambur loco works (FLAG", code="PEW", cat="SG3", div="MAS", lat=9.6063, lng=79.8326),
        dict(name="Perungudi", code="PRGD", cat="SG3", div="SA", lat=8.588, lng=76.8981),
        dict(name="Ponneri", code="PON", cat="SG3", div="CBE", lat=9.4388, lng=79.713),
        dict(name="Puliamanagalam (HALT", code="PLMG", cat="SG3", div="PGT", lat=12.7275, lng=79.8717),
        dict(name="Putlur (HALT", code="PTLR", cat="SG3", div="TVC", lat=11.8902, lng=78.7743),
        dict(name="Royapuram (HALT", code="RPM", cat="SG3", div="MAS", lat=12.998, lng=78.0923),
        dict(name="Saidapet", code="SP", cat="SG3", div="SA", lat=10.6683, lng=76.6195),
        dict(name="Senjipanampakkam (HALT", code="SPAM", cat="SG3", div="CBE", lat=10.2048, lng=78.8204),
        dict(name="Sevwvapet road", code="SVR", cat="SG3", div="PGT", lat=10.0568, lng=79.7623),
        dict(name="St.thomasmount", code="STM", cat="SG3", div="TVC", lat=11.2636, lng=76.6519),
        dict(name="Tambaram sanitorium (FLAG", code="TBMS", cat="SG3", div="MAS", lat=11.0854, lng=79.6123),
        dict(name="Taramani", code="TRMN", cat="SG3", div="SA", lat=9.7614, lng=76.9141),
        dict(name="Thirumullaivoil (HALT", code="TMVL", cat="SG3", div="CBE", lat=12.7138, lng=77.612),
        dict(name="Thiruninravur", code="Tl", cat="SG3", div="PGT", lat=8.6766, lng=79.0678),
        dict(name="Tirumayilai", code="MTMY", cat="SG3", div="TVC", lat=8.4201, lng=77.7242),
        dict(name="Tirusulam (FLAG", code="TLM", cat="SG3", div="MAS", lat=10.8648, lng=78.0876),
        dict(name="Tiruvalangadu", code="TO", cat="SG3", div="SA", lat=8.6323, lng=76.8526),
        dict(name="Tiruvallikeni (FLAG", code="MTCN", cat="SG3", div="CBE", lat=11.0535, lng=77.3223),
        dict(name="Tiruvanmiyur", code="TYMR:", cat="SG3", div="PGT", lat=8.8781, lng=79.122),
        dict(name="Tiruvottiyur", code="TVT", cat="SG3", div="TVC", lat=9.0417, lng=78.9266),
        dict(name="Tondiarpet (FLAG", code="TNP", cat="SG3", div="MAS", lat=8.7878, lng=77.5774),
        dict(name="", code="Veppambattu (FLAG)", cat="VEU", div="SA", lat=8.4013, lng=76.3463),
        dict(name="Villivakkam", code="VLK", cat="SG3", div="CBE", lat=11.8312, lng=77.5312),
        dict(name="Voc nagar", code="VOC", cat="SG3", div="PGT", lat=11.6395, lng=79.452),
        dict(name="", code="Vyasarpadi jeeva (FLAG)", cat="VJM", div="TVC", lat=9.9797, lng=78.6223),
        dict(name="Washermanpet", code="WST", cat="SG3", div="MAS", lat=9.5131, lng=77.079),
        dict(name="Wimco nagar (FLAG", code="WCN", cat="SG3", div="SA", lat=12.9993, lng=79.0736),
        dict(name="", code="Anavardikanpettai (HALT)", cat="AVN", div="CBE", lat=12.1748, lng=78.4335),
        dict(name="Kanchipuram east (HALT", code="CJE", cat="HG 1", div="PGT", lat=9.8903, lng=77.5316),
        dict(name="Maraimalai nagar (HALT", code="MMNK", cat="HG 1", div="TVC", lat=8.4132, lng=76.0472),
        dict(name="Paranur (HALT", code="PWU", cat="HG 1", div="MAS", lat=12.7977, lng=76.4815),
        dict(name="Potheri (HALT", code="POT!", cat="HG 1", div="SA", lat=10.7254, lng=78.6577),
        dict(name="Urappakkam (HALT", code="UPM", cat="HG 1", div="CBE", lat=10.8814, lng=77.6806),
        dict(name="Melattur (HALT", code="MLTR", cat="HG 1", div="PGT", lat=9.5493, lng=77.9591),
        dict(name="Pattikkad (HALT", code="PKQ", cat="HG 1", div="TVC", lat=12.1273, lng=78.6004),
        dict(name="Divine nagar (HALT", code="DINR", cat="HG 1", div="MAS", lat=11.2901, lng=78.971),
        dict(name="Koratti angadi (HALT", code="KRAN", cat="HG 1", div="SA", lat=11.6098, lng=76.1173),
        dict(name="Villiyanur (HALT", code="vi", cat="HG 1", div="CBE", lat=9.9911, lng=78.7679),
        dict(name="Acharapakkam (HALT", code="ACK", cat="HG 2", div="PGT", lat=10.5559, lng=77.3485),
        dict(name="", code="Akkampet (HALT)", cat="AKAT", div="TVC", lat=12.4047, lng=76.4142),
        dict(name="Melalathur (HALT", code="MEH", cat="HG 2", div="MAS", lat=8.9831, lng=78.754),
        dict(name="Villiambakkam (HALT", code="VB", cat="HG 2", div="SA", lat=10.9204, lng=76.0459),
        dict(name="Virinchipuram (HALT", code="Vd", cat="HG 2", div="CBE", lat=9.9946, lng=76.4273),
        dict(name="", code="Ayodhyapattanam (HALT)", cat="APN", div="PGT", lat=10.3075, lng=78.906),
        dict(name="Irugur (HALT", code="IGU", cat="HG 2", div="TVC", lat=9.0205, lng=76.3422),
        dict(name="Kuttakudi (HALT", code="KKTI", cat="HG 2", div="MAS", lat=9.2993, lng=78.7004),
        dict(name="Melnariyappanur (HALT", code="MLYR", cat="HG 2", div="SA", lat=9.4418, lng=79.4216),
        dict(name="Periyanaikanpalaiyam (HALT", code="PKM", cat="HG 2", div="CBE", lat=12.4431, lng=77.7378),
        dict(name="Singanallur (HALT", code="SHI", cat="HG 2", div="PGT", lat=11.8553, lng=78.695),
        dict(name="Siruvattur (HALT", code="SRVT", cat="HG 2", div="TVC", lat=10.0353, lng=79.2585),
        dict(name="Talaivasal (HALT", code="Tvs", cat="HG 2", div="MAS", lat=11.9679, lng=78.6975),
        dict(name="Thonganur (HALT", code="TNGR", cat="HG 2", div="SA", lat=10.4375, lng=76.2751),
        dict(name="Vallapadi gate (HALT", code="VGE", cat="HG 2", div="CBE", lat=12.4853, lng=76.5234),
        dict(name="Chandera (HALT", code="CDRA", cat="HG 2", div="PGT", lat=10.4791, lng=76.9343),
        dict(name="Chemancheri (HALT", code="CMC", cat="HG 2", div="TVC", lat=9.8751, lng=79.1916),
        dict(name="Cherukara (HALT", code="CQA", cat="HG 2", div="MAS", lat=10.2965, lng=76.8492),
        dict(name="Elimala (Halt", code="ELM", cat="HG 2", div="SA", lat=11.0215, lng=78.5044),
        dict(name="Jagannath temple gate (Halt", code="JGE", cat="HG 2", div="CBE", lat=11.0917, lng=76.5707),
        dict(name="Kalanad (HALT", code="KLAD", cat="HG 2", div="PGT", lat=10.8894, lng=78.1085),
        dict(name="Kulukkallur (HALT", code="KZC", cat="HG 2", div="TVC", lat=11.2502, lng=79.8611),
        dict(name="Mukkali (HALT", code="MUKE", cat="HG 2", div="MAS", lat=8.9486, lng=78.0739),
        dict(name="Nadapuram road (HALT", code="NAU", cat="HG 2", div="SA", lat=8.2173, lng=77.0371),
        dict(name="Pappinisseri (Halt", code="PPNS", cat="HG 2", div="CBE", lat=12.9508, lng=79.5676),
        dict(name="Todiyappulam (HALT", code="TDPM", cat="HG 2", div="PGT", lat=8.5503, lng=79.3899),
        dict(name="Tuvvur (HALT", code="TUV", cat="HG 2", div="TVC", lat=11.6862, lng=78.1678),
        dict(name="", code="Vadanamkurushshi (HALT)", cat="VDKS", div="MAS", lat=11.6451, lng=79.9229),
        dict(name="Vallapuzha (HALT", code="VPZ", cat="HG 2", div="SA", lat=10.1542, lng=78.6548),
        dict(name="Vellayil (HALT", code="VLL", cat="HG 2", div="CBE", lat=12.0483, lng=79.2535),
        dict(name="", code="Amaravila (HALT)", cat="AMVA", div="PGT", lat=11.1933, lng=76.8528),
        dict(name="Balaramapuram (Halt", code="BRAM", cat="HG 2", div="TVC", lat=12.7634, lng=77.9203),
        dict(name="Cheriyanad (HALT", code="CYN", cat="HG 2", div="MAS", lat=9.5285, lng=79.5648),
        dict(name="Chowvara (HALT", code="CWR", cat="HG 2", div="SA", lat=12.0068, lng=79.6904),
        dict(name="Dhanuvachapuram (HALT", code="DAVM", cat="HG 2", div="CBE", lat=11.6087, lng=79.3002),
        dict(name="lravipuram (HALT", code="IRP", cat="HG 2", div="PGT", lat=11.5897, lng=78.968),
        dict(name="Kalavur (HALT", code="KAVR", cat="HG 2", div="TVC", lat=10.3904, lng=78.2026),
        dict(name="Kanjiramittam (HALT", code="KPTM", cat="HG 2", div="MAS", lat=8.1488, lng=78.9009),
        dict(name="Karuvatta (HALT", code="KVTA", cat="HG 2", div="SA", lat=11.3654, lng=77.7233),
        dict(name="Kulitturai west (HALT", code="KZTW", cat="HG 2", div="CBE", lat=9.188, lng=78.376),
        dict(name="Mullurcarai (HALT", code="MUC", cat="HG 2", div="PGT", lat=8.1988, lng=76.7617),
        dict(name="Munroturuttu (HALT", code="MQO,", cat="HG 2", div="TVC", lat=11.4908, lng=78.5513),
        dict(name="Nellayi (HALT", code="NYI", cat="HG 2", div="MAS", lat=9.4229, lng=79.7002),
        dict(name="Palliyadi (HALT", code="PYD", cat="HG 2", div="SA", lat=9.4754, lng=79.7103),
        dict(name="Perunguzhi (HALT", code="PGZ", cat="HG 2", div="CBE", lat=10.588, lng=79.2104),
        dict(name="Punnapra (HALT", code="PNPR", cat="HG 2", div="PGT", lat=12.6414, lng=76.9243),
        dict(name="Tumboli (HALT", code="TMPY", cat="HG 2", div="TVC", lat=10.7032, lng=77.6693),
        dict(name="", code="\Vayalar (HALT)", cat="VAY", div="MAS", lat=12.7698, lng=77.8103),
        dict(name="Veli (HALT", code="VELI", cat="HG 2", div="SA", lat=11.9945, lng=79.7225),
        dict(name="Virani alur (HALT", code="VRLR", cat="HG 2", div="CBE", lat=10.4655, lng=77.3101),
        dict(name="", code="Aiyanapuram (HALT)", cat="AYN", div="PGT", lat=10.9668, lng=79.701),
        dict(name="", code="Ammapet (HALT)", cat="AMT", div="TVC", lat=12.1837, lng=76.6638),
        dict(name="Darasuram (HALT", code="DSM", cat="HG 2", div="MAS", lat=8.8827, lng=79.4466),
        dict(name="Manjattidal (HALT", code="MCJ", cat="HG 2", div="SA", lat=12.9972, lng=79.6476),
        dict(name="Nidur (HALT", code="NID", cat="HG 2", div="CBE", lat=8.9772, lng=78.4815),
        dict(name="Parangipettai (HALT", code="PO", cat="HG 2", div="PGT", lat=8.6014, lng=76.8921),
        dict(name="Pichchandar Koil (HALT", code="BxXS.", cat="HG 2", div="TVC", lat=11.4202, lng=78.016),
        dict(name="Swamimalai (HALT", code="SWI", cat="HG 2", div="MAS", lat=9.3913, lng=79.0384),
        dict(name="Tiruchchirappalli palakarai (HALT", code="TPE", cat="HG 2", div="SA", lat=11.0376, lng=77.7531),
        dict(name="Tiruvidaimarudur (HALT", code="TDR", cat="HG 2", div="CBE", lat=9.682, lng=76.9858),
        dict(name="\Valavanur (HALT", code="VRA", cat="HG 2", div="PGT", lat=11.5897, lng=77.7784),
        dict(name="Velippalaiyam (HALT", code="VXM", cat="HG 2", div="TVC", lat=9.4506, lng=77.3456),
        dict(name="Velore town (HALT", code="VT", cat="HG 2", div="MAS", lat=10.0877, lng=79.8259),
        dict(name="\Vriddhachalam town (HALT", code="VRT", cat="HG 2", div="SA", lat=12.9961, lng=77.2289),
        dict(name="Azhwarkurichi (HALT", code="AZK", cat="HG 2", div="CBE", lat=11.7017, lng=78.8476),
        dict(name="Chettiyapatti (HALT", code="cil", cat="HG 2", div="PGT", lat=10.253, lng=77.4629),
        dict(name="Kailasapuram (HALT", code="KLPM", cat="HG 2", div="TVC", lat=11.1852, lng=79.5256),
        dict(name="Karaikkurichchi (HALT", code="KARK", cat="HG 2", div="MAS", lat=11.2085, lng=79.0265),
        dict(name="Kizha ambur (HALT", code="KIB", cat="HG 2", div="SA", lat=12.9677, lng=78.4741),
        dict(name="Kottaiyur (HALT", code="KTYR", cat="HG 2", div="CBE", lat=11.7825, lng=76.3317),
        dict(name="Kuri (HALT", code="KIF", cat="HG 2", div="PGT", lat=10.4469, lng=77.134),
        dict(name="Madathukulam (HALT", code="MDKM", cat="HG 2", div="TVC", lat=10.6462, lng=79.1052),
        dict(name="Mandapam camp (HALT", code="MC.", cat="HG 2", div="MAS", lat=8.0298, lng=79.175),
        dict(name="Naraikkinar (Halt", code="NRK", cat="HG 2", div="SA", lat=8.7407, lng=79.7453),
        dict(name="Tutimelur (HALT", code="TME", cat="HG 2", div="CBE", lat=10.3474, lng=79.5137),
        dict(name="Valantaravai (HALT", code="VIV", cat="HG 2", div="PGT", lat=8.1759, lng=76.6146),
        dict(name="Viravanallur (HALT", code="VVR", cat="HG 2", div="TVC", lat=11.3891, lng=77.5302),
        dict(name="Ichchiputtur (HALT", code="IPT", cat="HG 3", div="MAS", lat=10.2009, lng=79.704),
        dict(name="Nathapettai (HALT", code="NTT", cat="HG 3", div="SA", lat=11.5843, lng=78.0066),
        dict(name="Padalam (HALT", code="PTM", cat="HG 3", div="CBE", lat=12.8099, lng=78.329),
        dict(name="Padi (HALT", code="PADI", cat="HG 3", div="PGT", lat=9.5335, lng=79.9379),
        dict(name="Palayasivaram (HALT", code="PYV", cat="HG 3", div="TVC", lat=10.4193, lng=77.47),
        dict(name="Reddipalayam (HALT", code="RDY", cat="HG 3", div="MAS", lat=8.153, lng=76.4117),
        dict(name="Thakkolam (HALT", code="TKO", cat="HG 3", div="SA", lat=8.7673, lng=78.7987),
        dict(name="/\Venkatanarasimharajuvaripeta (HALT", code="VKZ", cat="HG 3", div="CBE", lat=12.7451, lng=76.455),
        dict(name="Jiyapuram (HALT", code="JPM", cat="HG 3", div="PGT", lat=9.6329, lng=77.6635),
        dict(name="Kunnattur (HALT", code="KNNT", cat="HG 3", div="TVC", lat=8.1453, lng=76.8949),
        dict(name="Marudur (HALT", code="MUQ", cat="HG 3", div="MAS", lat=12.9189, lng=79.1717),
        dict(name="Thudiyalur (HALT", code="TDE", cat="HG 3", div="SA", lat=8.1019, lng=78.615),
        dict(name="Timmachipuram (HALT", code="TIC", cat="HG 3", div="CBE", lat=12.2773, lng=79.3608),
        dict(name="Vangal (HALT", code="VNGL", cat="HG 3", div="PGT", lat=8.3213, lng=77.7524),
        dict(name="Anamalai road (HALT", code="ANM", cat="HG 3", div="TVC", lat=9.4432, lng=77.2601),
        dict(name="Chirakkal (HALT", code="cal", cat="HG 3", div="MAS", lat=8.2774, lng=79.9754),
        dict(name="Dharmadam (HALT", code="DMD", cat="HG 3", div="SA", lat=11.4562, lng=76.6254),
        dict(name="Iringal (HALT", code="IGL", cat="HG 3", div="CBE", lat=11.228, lng=77.394),
        dict(name="Kodumunda (HALT", code="KODN", cat="HG 3", div="PGT", lat=9.7518, lng=79.1785),
        dict(name="Mankara (HALT", code="MNY", cat="HG 3", div="TVC", lat=11.5503, lng=78.8635),
        dict(name="Palappuram (HALT", code="PLPM", cat="HG 3", div="MAS", lat=11.7742, lng=77.2894),
        dict(name="Perashshannur (HALT", code="PEU", cat="HG 3", div="SA", lat=11.9075, lng=78.1411),
        dict(name="\Vadakannikapuram (HALT", code="VDK", cat="HG 3", div="CBE", lat=9.5612, lng=79.4022),
        dict(name="Vellarakkad (HALT", code="VEK", cat="HG 3", div="PGT", lat=12.6368, lng=77.2744),
        dict(name="Akathumuri (HALT", code="AMY", cat="HG 3", div="TVC", lat=9.7564, lng=78.5496),
        dict(name="Aroor (HALT", code="AROR", cat="HG 3", div="MAS", lat=9.7047, lng=78.792),
        dict(name="Chottanikara road (HALT", code="KFE", cat="HG 3", div="SA", lat=11.7314, lng=79.2533),
        dict(name="Ezhupunna (HALT", code="EZP", cat="HG 3", div="CBE", lat=9.2501, lng=78.5799),
        dict(name="Kaduturutty (HALT", code="KDTY", cat="HG 3", div="PGT", lat=11.6817, lng=76.9522),
        dict(name="Kappil (HALT", code="KFI", cat="HG 3", div="TVC", lat=12.5017, lng=77.5976),
        dict(name="Kavalkinaru (HALT", code="KVLK", cat="HG 3", div="MAS", lat=10.1774, lng=77.375),
        dict(name="Kumaranallur (HALT", code="KFQ", cat="HG 3", div="SA", lat=8.7055, lng=79.5033),
        dict(name="Melappalayam (HALT", code="MP.", cat="HG 3", div="CBE", lat=11.7239, lng=79.5773),
        dict(name="Takazhi (HALT", code="TZH", cat="HG 3", div="PGT", lat=12.9419, lng=78.6787),
        dict(name="Tiruvizha (HALT", code="TRVZ", cat="HG 3", div="TVC", lat=8.1898, lng=78.1484),
        dict(name="Tovalai (HALT", code="THX", cat="HG 3", div="MAS", lat=10.0218, lng=79.7832),
        dict(name="Adhichchanur (HALT", code="ACN", cat="HG 3", div="SA", lat=12.1689, lng=76.5417),
        dict(name="", code="Adiyakkamangalam (HALT)", cat="AYM", div="CBE", lat=10.0272, lng=79.393),
        dict(name="", code="Alattambadi (HALT)", cat="ATB", div="PGT", lat=12.6357, lng=77.031),
        dict(name="", code="Ammanur (HALT)", cat="AMNR", div="TVC", lat=11.7181, lng=76.0569),
        dict(name="", code="Andampallam (HALT)", cat="AND", div="MAS", lat=8.4718, lng=77.721),
        dict(name="Andanappettai (HALT", code="APE", cat="HG 3", div="SA", lat=8.3399, lng=76.0701),
        dict(name="Ayandur (HALT", code="AYD", cat="HG 3", div="CBE", lat=12.1822, lng=77.0789),
        dict(name="", code="Ayyampet (HALT)", cat="AZP", div="PGT", lat=8.6194, lng=76.3036),
        dict(name="Capper quarry (HALT", code="cas", cat="HG 3", div="TVC", lat=10.3353, lng=78.5945),
        dict(name="Ichchangadu (HALT", code="ICGH", cat="HG 3", div="MAS", lat=10.8478, lng=77.03),
        dict(name="Kandanur puduvayal (HALT", code="KNPL.", cat="HG 3", div="SA", lat=9.5948, lng=77.9514),
        dict(name="Kattur (HALT", code="KTTR", cat="HG 3", div="CBE", lat=10.8563, lng=76.2421),
        dict(name="Koyilvenni (HALT", code="KYV", cat="HG 3", div="PGT", lat=12.9406, lng=76.5965),
        dict(name="Kudikadu (HALT", code="KXO", cat="HG 3", div="TVC", lat=11.2598, lng=79.4293),
        dict(name="Kuthur (HALT", code="KOQ", cat="HG 3", div="MAS", lat=9.0942, lng=76.6103),
        dict(name="Madimangalam (HALT", code="MCL", cat="HG 3", div="SA", lat=10.7461, lng=77.3397),
        dict(name="Manali (HALT", code="MNLI", cat="HG 3", div="CBE", lat=10.62, lng=77.39),
        dict(name="Mangudi (HALT", code="MAX", cat="HG 3", div="PGT", lat=10.1126, lng=78.5693),
        dict(name="Mavur road (HALT", code="MARD.", cat="HG 3", div="TVC", lat=8.5091, lng=77.7997),
        dict(name="Muthupettai (HALT", code="MTT", cat="HG 3", div="MAS", lat=11.6762, lng=76.9405),
        dict(name="Narasinganpet (HALT", code="NPT", cat="HG 3", div="SA", lat=10.9125, lng=78.3633),
        dict(name="Onnupuram (HALT", code="OPM", cat="HG 3", div="CBE", lat=9.7952, lng=77.1227),
        dict(name="Ottankadu (HALT", code="TCT", cat="HG 3", div="PGT", lat=8.1472, lng=77.3093),
        dict(name="Pasupathikoil (HALT", code="PVL", cat="HG 3", div="TVC", lat=12.6577, lng=79.9205),
        dict(name="Pennathur (HALT", code="PNTR", cat="HG 3", div="MAS", lat=9.699, lng=77.5603),
        dict(name="Punthottam Halt", code="POM", cat="HG 3", div="SA", lat=9.3692, lng=77.5299),
        dict(name="Sedarampattu (HALT", code="SDPT", cat="HG 3", div="CBE", lat=11.7814, lng=78.2559),
        dict(name="Sikkal (HALT", code="SKK", cat="HG 3", div="PGT", lat=11.0487, lng=77.7627),
        dict(name="Tirumalairayan Pattinam (HALT", code="TMPT", cat="HG 3", div="TVC", lat=8.6245, lng=79.4098),
        dict(name="Tirumathikunnam (HALT", code="TMU", cat="HG 3", div="MAS", lat=9.8275, lng=78.0622),
        dict(name="Tirunageswaram (HALT", code="TRM", cat="HG 3", div="SA", lat=8.2463, lng=79.5464),
        dict(name="Tondamanpatti (HALT", code="TOM", cat="HG 3", div="CBE", lat=11.1729, lng=79.6298),
        dict(name="Uthamar kovil (HALT", code="UKV", cat="HG 3", div="PGT", lat=11.2925, lng=79.9051),
        dict(name="Valaramanikkam (HALT", code="VMM", cat="HG 3", div="TVC", lat=10.5727, lng=76.9264),
        dict(name="Vallampadugai (HALT", code="VMP", cat="HG 3", div="MAS", lat=11.1511, lng=79.3557),
        dict(name="\Varakalpattu (HALT", code="VKP", cat="HG 3", div="SA", lat=8.8904, lng=79.261),
        dict(name="Vellur (HALT", code="VER", cat="HG 3", div="CBE", lat=12.1579, lng=76.2116),
        dict(name="Aryankavu (HALT", code="AYV", cat="HG 3", div="PGT", lat=12.8237, lng=77.5852),
        dict(name="Chandanattop (HALT", code="CTPE", cat="HG 3", div="TVC", lat=12.3877, lng=78.2134),
        dict(name="Edapalayam (HALT", code="EDP", cat="HG 3", div="MAS", lat=8.0228, lng=77.5093),
        dict(name="Kalthurithi (HALT", code="KTHY", cat="HG 3", div="SA", lat=11.1452, lng=77.8021),
        dict(name="Kundara east (HALT", code="KFV", cat="HG 3", div="CBE", lat=12.9264, lng=77.2554),
        dict(name="Nagamalai west (HALT", code="NGMW", cat="HG 3", div="PGT", lat=8.0551, lng=78.7261),
        dict(name="Namanasamudram (HALT", code="NMN", cat="HG 3", div="TVC", lat=8.5337, lng=79.0296),
        dict(name="Ottakkal (Halt", code="OKL", cat="HG 3", div="MAS", lat=12.5205, lng=79.4224),
        dict(name="Rajagambiram (HALT", code="RAGM", cat="HG 3", div="SA", lat=12.0004, lng=79.3484),
        dict(name="Samudram (HALT", code="SMDM", cat="HG 3", div="CBE", lat=8.8168, lng=77.9491),
        dict(name="\Vadpalanji (HALT", code="VAJ", cat="HG 3", div="PGT", lat=9.6485, lng=77.2506),
    ]
    station_map = {}
    for s in stations_data:
        existing = db.query(Station).filter(Station.code == s["code"]).first()
        if not existing:
            obj = Station(
                name=s["name"], code=s["code"], category=s["cat"],
                division_id=div_map[s["div"]].id,
                gps_lat=s["lat"], gps_long=s["lng"],
            )
            db.add(obj); db.flush()
            station_map[s["code"]] = obj
            print(f"  [STN] {s['name']}")
        else:
            station_map[s["code"]] = existing
    db.commit()

    if "station.user" in user_map:
        user_map["station.user"].station_id = station_map["MAS"].id
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # WATER SOURCES (varied statuses for demo)
    # ─────────────────────────────────────────────────────────────────────────
    sources_data = [
        # Chennai Central — COMPLIANT
        dict(code="MAS-BW-01", stn="MAS", type="Borewell", cap="50,000 L/day",
             areas="Platform 1-5, Waiting Hall", pop=5000, tank="2x25kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=13.0827, lng=80.2705,
             last_bact=now-datetime.timedelta(days=10),
             next_bact=now+datetime.timedelta(days=20),
             last_chem=now-datetime.timedelta(days=25),
             next_chem=now+datetime.timedelta(days=65),
             last_dis=now-datetime.timedelta(days=5),
             next_dis=now+datetime.timedelta(days=25),
             cl=0.3),
        # Chennai Central — UNFIT (for demo alert)
        dict(code="MAS-OW-01", stn="MAS", type="Open Well", cap="20,000 L/day",
             areas="Goods Shed, Workshop", pop=800, tank="1x20kL",
             treat="None", dis_m="Bleaching Powder", dis_freq=15,
             status="UNFIT", cons_fail=1, lat=13.0826, lng=80.2708,
             last_bact=now-datetime.timedelta(days=3),
             next_bact=now+datetime.timedelta(days=27),
             last_chem=now-datetime.timedelta(days=15),
             next_chem=now+datetime.timedelta(days=75),
             last_dis=now-datetime.timedelta(days=3),
             next_dis=now+datetime.timedelta(days=12),
             cl=0.0),
        # Tambaram — COMPLIANT
        dict(code="TBM-PL-01", stn="TBM", type="Pipeline (CMWSSB)", cap="30,000 L/day",
             areas="Platform 1-3, Staff Quarters", pop=2000, tank="1x30kL",
             treat="None", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=12.9249, lng=80.1001,
             last_bact=now-datetime.timedelta(days=5),
             next_bact=now+datetime.timedelta(days=25),
             last_chem=now-datetime.timedelta(days=20),
             next_chem=now+datetime.timedelta(days=70),
             last_dis=now-datetime.timedelta(days=3),
             next_dis=now+datetime.timedelta(days=27),
             cl=0.4),
        # Arakkonam — OVERDUE
        dict(code="AJJ-BW-01", stn="AJJ", type="Borewell", cap="15,000 L/day",
             areas="All Platforms", pop=600, tank="1x15kL",
             treat="UV", dis_m="Chlorination", dis_freq=30,
             status="OVERDUE", cons_fail=0, lat=13.0836, lng=79.6702,
             last_bact=now-datetime.timedelta(days=65),
             next_bact=now-datetime.timedelta(days=35),
             last_chem=now-datetime.timedelta(days=130),
             next_chem=now-datetime.timedelta(days=40),
             last_dis=now-datetime.timedelta(days=45),
             next_dis=now-datetime.timedelta(days=15),
             cl=None),
        # Salem — UNSATISFACTORY
        dict(code="SA-BW-01", stn="SA", type="Borewell", cap="35,000 L/day",
             areas="Platform 1-4, Catering", pop=1500, tank="2x17.5kL",
             treat="Filtration", dis_m="Chlorination+UV", dis_freq=30,
             status="UNSATISFACTORY", cons_fail=1, lat=11.6644, lng=78.1460,
             last_bact=now-datetime.timedelta(days=8),
             next_bact=now+datetime.timedelta(days=22),
             last_chem=now-datetime.timedelta(days=20),
             next_chem=now+datetime.timedelta(days=70),
             last_dis=now-datetime.timedelta(days=8),
             next_dis=now+datetime.timedelta(days=22),
             cl=0.1),
        # Coimbatore — COMPLIANT
        dict(code="CBE-PL-01", stn="CBE", type="Pipeline (TWAD)", cap="80,000 L/day",
             areas="All Platforms, Offices", pop=8000, tank="4x20kL",
             treat="RO Plant", dis_m="Chlorination+RO", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=11.0042, lng=76.9754,
             last_bact=now-datetime.timedelta(days=2),
             next_bact=now+datetime.timedelta(days=28),
             last_chem=now-datetime.timedelta(days=8),
             next_chem=now+datetime.timedelta(days=82),
             last_dis=now-datetime.timedelta(days=1),
             next_dis=now+datetime.timedelta(days=29),
             cl=0.5),
        # Palakkad — PERSISTENT FAILURE
        dict(code="PGT-BW-01", stn="PGT", type="Borewell", cap="25,000 L/day",
             areas="Platform 1-3", pop=1000, tank="1x25kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="PERSISTENT_FAILURE", cons_fail=3, lat=10.7867, lng=76.6548,
             last_bact=now-datetime.timedelta(days=5),
             next_bact=now+datetime.timedelta(days=25),
             last_chem=now-datetime.timedelta(days=18),
             next_chem=now+datetime.timedelta(days=72),
             last_dis=now-datetime.timedelta(days=5),
             next_dis=now+datetime.timedelta(days=25),
             cl=0.0),
        # Trivandrum — COMPLIANT
        dict(code="TVC-PL-01", stn="TVC", type="Pipeline (KWA)", cap="100,000 L/day",
             areas="All Platforms, VIP Lounge, Catering", pop=12000, tank="4x25kL",
             treat="None", dis_m="Chlorination", dis_freq=30,
             status="COMPLIANT", cons_fail=0, lat=8.4875, lng=76.9525,
             last_bact=now-datetime.timedelta(days=1),
             next_bact=now+datetime.timedelta(days=29),
             last_chem=now-datetime.timedelta(days=5),
             next_chem=now+datetime.timedelta(days=85),
             last_dis=now-datetime.timedelta(days=2),
             next_dis=now+datetime.timedelta(days=28),
             cl=0.6),
        # Chennai Egmore — DUE
        dict(code="MS-BW-01", stn="MS", type="Borewell", cap="18,000 L/day",
             areas="Platform 1-6", pop=1200, tank="1x18kL",
             treat="Chlorination", dis_m="Chlorination", dis_freq=30,
             status="OVERDUE", cons_fail=0, lat=13.0782, lng=80.2673,
             last_bact=now-datetime.timedelta(days=35),
             next_bact=now-datetime.timedelta(days=5),
             last_chem=now-datetime.timedelta(days=95),
             next_chem=now-datetime.timedelta(days=5),
             last_dis=now-datetime.timedelta(days=35),
             next_dis=now-datetime.timedelta(days=5),
             cl=None),
    ]

    source_map = {}
    for s in sources_data:
        existing = db.query(WaterSource).filter(WaterSource.source_id_code == s["code"]).first()
        if not existing:
            obj = WaterSource(
                source_id_code=s["code"],
                station_id=station_map[s["stn"]].id,
                source_type=s["type"], capacity=s["cap"],
                areas_supplied=s["areas"], population_served=s["pop"],
                storage_tank=s["tank"], treatment_facility=s["treat"],
                disinfection_method=s["dis_m"],
                disinfection_frequency_days=s["dis_freq"],
                gps_lat=s["lat"], gps_long=s["lng"],
                current_status=s["status"],
                consecutive_failures=s["cons_fail"],
                total_failures=s["cons_fail"],
                last_bacteriological_sample_date=s["last_bact"],
                next_bacteriological_sample_due=s["next_bact"],
                last_chemical_sample_date=s["last_chem"],
                next_chemical_sample_due=s["next_chem"],
                last_disinfection_date=s["last_dis"],
                next_disinfection_due=s["next_dis"],
                residual_chlorine_last=s["cl"],
            )
            db.add(obj); db.flush()
            source_map[s["code"]] = obj
            print(f"  [WS] {s['code']} [{s['status']}]")
        else:
            source_map[s["code"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # LABORATORY
    # ─────────────────────────────────────────────────────────────────────────
    from models.lab import Laboratory, LabSample, LabReport, LabResultEntry

    labs_data = [
        dict(name="SR Central Water Testing Lab", code="SR-WTL",
             location="Chennai", accreditation_number="NABL-WQ-2024-001",
             contact_person="Dr. K. Rajan", contact_email="lab.central@sr.ir.in",
             contact_phone="9445000001", is_active=True),
        dict(name="Divisional Water Lab Chennai", code="MAS-WTL",
             location="Chennai", accreditation_number="NABL-WQ-2024-002",
             contact_person="Mr. S. Kumar", contact_email="lab.mas@sr.ir.in",
             contact_phone="9445000002", is_active=True),
    ]
    lab_map = {}
    for l in labs_data:
        existing = db.query(Laboratory).filter(Laboratory.code == l["code"]).first()
        if not existing:
            obj = Laboratory(**l); db.add(obj); db.flush()
            lab_map[l["code"]] = obj
            print(f"  [LAB] {l['name']}")
        else:
            lab_map[l["code"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # PARAMETERS
    # ─────────────────────────────────────────────────────────────────────────
    from models.master import Parameter, WaterQualityStandard

    params_data = [
        dict(name="pH", cat="Chemical", unit="pH units", qualitative=False, order=1),
        dict(name="Turbidity", cat="Physical", unit="NTU", qualitative=False, order=2),
        dict(name="Total Dissolved Solids", cat="Chemical", unit="mg/L", qualitative=False, order=3),
        dict(name="Total Hardness", cat="Chemical", unit="mg/L as CaCO3", qualitative=False, order=4),
        dict(name="Total Alkalinity", cat="Chemical", unit="mg/L as CaCO3", qualitative=False, order=5),
        dict(name="Fluoride", cat="Chemical", unit="mg/L", qualitative=False, order=6),
        dict(name="Chloride", cat="Chemical", unit="mg/L", qualitative=False, order=7),
        dict(name="Sulphate", cat="Chemical", unit="mg/L", qualitative=False, order=8),
        dict(name="Nitrate", cat="Chemical", unit="mg/L", qualitative=False, order=9),
        dict(name="Iron", cat="Chemical", unit="mg/L", qualitative=False, order=10),
        dict(name="Arsenic", cat="Chemical", unit="mg/L", qualitative=False, order=11),
        dict(name="Total Coliform", cat="Bacteriological", unit="MPN/100mL", qualitative=True, order=12),
        dict(name="E. coli", cat="Bacteriological", unit="MPN/100mL", qualitative=True, order=13),
        dict(name="Free Residual Chlorine", cat="Chemical", unit="mg/L", qualitative=False, order=14),
        dict(name="Colour", cat="Physical", unit="Hazen units", qualitative=False, order=15),
        dict(name="Ammonia", cat="Chemical", unit="mg/L", qualitative=False, order=16),
    ]
    param_map = {}
    for p in params_data:
        existing = db.query(Parameter).filter(Parameter.name == p["name"]).first()
        if not existing:
            obj = Parameter(
                name=p["name"], category=p["cat"], unit=p["unit"],
                is_qualitative=p["qualitative"], display_order=p["order"], is_active=True,
            )
            db.add(obj); db.flush()
            param_map[p["name"]] = obj
            print(f"  [PARAM] {p['name']}")
        else:
            param_map[p["name"]] = existing
    db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # STANDARDS (BIS IS 10500)
    # ─────────────────────────────────────────────────────────────────────────
    standards_data = [
        dict(param="pH", std="BIS IS 10500", mn=6.5, acc=8.5, perm=9.2, q_acc=None),
        dict(param="Turbidity", std="BIS IS 10500", mn=None, acc=1.0, perm=5.0, q_acc=None),
        dict(param="Total Dissolved Solids", std="BIS IS 10500", mn=None, acc=500.0, perm=2000.0, q_acc=None),
        dict(param="Total Hardness", std="BIS IS 10500", mn=None, acc=200.0, perm=600.0, q_acc=None),
        dict(param="Total Alkalinity", std="BIS IS 10500", mn=None, acc=200.0, perm=600.0, q_acc=None),
        dict(param="Fluoride", std="BIS IS 10500", mn=None, acc=1.0, perm=1.5, q_acc=None),
        dict(param="Chloride", std="BIS IS 10500", mn=None, acc=250.0, perm=1000.0, q_acc=None),
        dict(param="Sulphate", std="BIS IS 10500", mn=None, acc=200.0, perm=400.0, q_acc=None),
        dict(param="Nitrate", std="BIS IS 10500", mn=None, acc=45.0, perm=100.0, q_acc=None),
        dict(param="Iron", std="BIS IS 10500", mn=None, acc=0.3, perm=1.0, q_acc=None),
        dict(param="Arsenic", std="BIS IS 10500", mn=None, acc=0.01, perm=0.05, q_acc=None),
        dict(param="Total Coliform", std="BIS IS 10500", mn=None, acc=None, perm=None, q_acc="NOT DETECTED"),
        dict(param="E. coli", std="BIS IS 10500", mn=None, acc=None, perm=None, q_acc="NOT DETECTED"),
        dict(param="Free Residual Chlorine", std="BIS IS 10500", mn=0.2, acc=1.0, perm=None, q_acc=None),
        dict(param="Colour", std="BIS IS 10500", mn=None, acc=5.0, perm=15.0, q_acc=None),
        dict(param="Ammonia", std="BIS IS 10500", mn=None, acc=0.5, perm=None, q_acc=None),
    ]
    for s in standards_data:
        param = param_map.get(s["param"])
        if not param:
            continue
        existing = db.query(WaterQualityStandard).filter(
            WaterQualityStandard.parameter_id == param.id,
            WaterQualityStandard.standard_type == s["std"],
        ).first()
        if not existing:
            obj = WaterQualityStandard(
                parameter_id=param.id, standard_type=s["std"],
                min_acceptable=s["mn"], acceptable_limit=s["acc"],
                permissible_limit=s["perm"], qualitative_acceptable=s["q_acc"],
                is_active=True,
            )
            db.add(obj)
    db.commit()
    print("  [STDS] BIS IS 10500 standards seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # OFFICER RESPONSIBILITY MAPPING
    # ─────────────────────────────────────────────────────────────────────────
    from models.alert import OfficerResponsibility

    resp_data = [
        dict(src="MAS-OW-01", uid="hmi.user", role="HMI"),
        dict(src="MAS-OW-01", uid="engineering.user", role="ENGINEERING"),
        dict(src="MAS-OW-01", uid="station.user", role="STATION_INCHARGE"),
        dict(src="MAS-OW-01", uid="division.officer", role="DIVISIONAL_OFFICER"),
        dict(src="MAS-BW-01", uid="hmi.user", role="HMI"),
        dict(src="MAS-BW-01", uid="engineering.user", role="ENGINEERING"),
        dict(src="SA-BW-01", uid="DO-TPJ-001", role="DIVISIONAL_OFFICER"),
        dict(src="PGT-BW-01", uid="zonal.admin", role="ZONAL_ADMIN"),
    ]
    for r in resp_data:
        src = source_map.get(r["src"])
        usr = user_map.get(r["uid"])
        if src and usr:
            existing = db.query(OfficerResponsibility).filter(
                OfficerResponsibility.water_source_id == src.id,
                OfficerResponsibility.user_id == usr.id,
            ).first()
            if not existing:
                db.add(OfficerResponsibility(
                    water_source_id=src.id, user_id=usr.id,
                    role=r["role"], is_active=True,
                ))
    db.commit()
    print("  [RESP] Officer responsibilities mapped")

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO SAMPLES + REPORTS (for existing UNFIT/UNSATISFACTORY/COMPLIANT demo)
    # ─────────────────────────────────────────────────────────────────────────
    lab_user = user_map.get("lab.user")
    central_lab = lab_map.get("SR-WTL")
    mas_lab = lab_map.get("MAS-WTL")

    def make_sample(sid, source_code, stype, days_ago, collector):
        existing = db.query(LabSample).filter(LabSample.sample_id == sid).first()
        if existing:
            return existing
        s = LabSample(
            sample_id=sid,
            water_source_id=source_map[source_code].id,
            sample_type=stype,
            collection_date=now - datetime.timedelta(days=days_ago),
            collector_name=collector,
            collector_user_id=lab_user.id if lab_user else None,
            status="RESULT_ENTERED",
        )
        db.add(s); db.flush()
        return s

    def make_report(rid, sample, lab_obj, lab_rpt_no, days_ago_rpt, result, entries):
        existing = db.query(LabReport).filter(LabReport.report_id == rid).first()
        if existing:
            return existing
        r = LabReport(
            report_id=rid,
            sample_id=sample.id,
            laboratory_id=lab_obj.id,
            lab_report_number=lab_rpt_no,
            report_date=now - datetime.timedelta(days=days_ago_rpt),
            overall_result=result,
            evaluation_done=True,
            evaluated_at=now - datetime.timedelta(days=days_ago_rpt),
            submitted_by_user_id=lab_user.id if lab_user else None,
        )
        db.add(r); db.flush()
        for e in entries:
            param = param_map.get(e["p"])
            if param:
                db.add(LabResultEntry(
                    report_id=r.id, parameter_id=param.id,
                    observed_value=e["v"], is_qualitative=param.is_qualitative,
                    parameter_status=e["s"],
                ))
        db.commit()
        return r

    # Demo 1: MAS-OW-01 UNFIT report (pre-seeded alert)
    s1 = make_sample("SMP-MAS-OW-001", "MAS-OW-01", "Bacteriological", 3, "Lab Tech SR")
    r1 = make_report(
        "RPT-DEMO-001", s1, central_lab, "SR-WTL/2024/B/001", 3, "UNFIT",
        [
            dict(p="Total Coliform", v="DETECTED", s="FAIL"),
            dict(p="E. coli", v="DETECTED", s="FAIL"),
            dict(p="pH", v="6.8", s="PASS"),
            dict(p="Turbidity", v="2.1", s="ACCEPTABLE"),
        ]
    )

    # Demo 2: SA-BW-01 UNSATISFACTORY report
    s2 = make_sample("SMP-SA-BW-001", "SA-BW-01", "Chemical", 8, "Lab Tech SR")
    r2 = make_report(
        "RPT-DEMO-002", s2, mas_lab, "MAS-WTL/2024/C/001", 8, "UNSATISFACTORY",
        [
            dict(p="Total Hardness", v="280", s="ACCEPTABLE"),
            dict(p="Total Dissolved Solids", v="520", s="ACCEPTABLE"),
            dict(p="pH", v="7.2", s="PASS"),
            dict(p="Chloride", v="260", s="ACCEPTABLE"),
        ]
    )

    # Demo 3: MAS-BW-01 FIT (for contrast)
    s3 = make_sample("SMP-MAS-BW-001", "MAS-BW-01", "Bacteriological", 10, "Lab Tech MAS")
    make_report(
        "RPT-DEMO-003", s3, central_lab, "SR-WTL/2024/B/002", 10, "FIT",
        [
            dict(p="Total Coliform", v="NOT DETECTED", s="PASS"),
            dict(p="E. coli", v="NOT DETECTED", s="PASS"),
            dict(p="pH", v="7.1", s="PASS"),
            dict(p="Turbidity", v="0.5", s="PASS"),
            dict(p="Free Residual Chlorine", v="0.3", s="PASS"),
        ]
    )

    # Demo 4: PGT-BW-01 PERSISTENT FAILURE
    for i, days in enumerate([45, 20, 5]):
        sid = f"SMP-PGT-BW-00{i+1}"
        rid = f"RPT-PGT-00{i+1}"
        si = make_sample(sid, "PGT-BW-01", "Bacteriological", days, "Lab Tech PGT")
        make_report(
            rid, si, central_lab, f"SR-WTL/2024/B/PGT-0{i+1}", days, "UNFIT",
            [dict(p="Total Coliform", v="DETECTED", s="FAIL"),
             dict(p="E. coli", v="DETECTED", s="FAIL")]
        )

    print("  [REPORTS] Demo lab reports seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # DEMO ALERTS (auto-generate for pre-seeded UNFIT/UNSATISFACTORY sources)
    # ─────────────────────────────────────────────────────────────────────────
    from models.alert import Alert, AlertNotification
    from models.workflow import CorrectiveAction, RepeatSample
    from services.alert_engine import get_concerned_officers

    def make_alert(alert_id_str, report, source_code, result, status="OPEN",
                   is_escalated=False, ack_days=None):
        existing = db.query(Alert).filter(Alert.alert_id == alert_id_str).first()
        if existing:
            return existing

        from models.hierarchy import Zone as _Zone, Division as _Division, Station as _Station
        src = source_map[source_code]
        stn = db.query(_Station).filter(_Station.id == src.station_id).first()
        div = db.query(_Division).filter(_Division.id == stn.division_id).first() if stn else None
        zone = db.query(_Zone).filter(_Zone.id == div.zone_id).first() if div else None
        lab_obj = db.query(Laboratory).filter(Laboratory.id == report.laboratory_id).first()
        sample = db.query(LabSample).filter(LabSample.id == report.sample_id).first()

        fp_raw = [
            e for e in db.query(LabResultEntry).filter(
                LabResultEntry.report_id == report.id,
                LabResultEntry.parameter_status == "FAIL",
            ).all()
        ]
        fp_json = [
            {"name": param_map_rev.get(e.parameter_id, str(e.parameter_id)),
             "observed": e.observed_value, "limit": e.acceptable_limit, "status": "FAIL"}
            for e in fp_raw
        ]

        a = Alert(
            alert_id=alert_id_str,
            alert_type="WATER_QUALITY",
            severity="CRITICAL",
            lab_report_id=report.id,
            water_source_id=src.id,
            source_id_code=src.source_id_code,
            zone_name=zone.name if zone else "",
            division_name=div.name if div else "",
            station_name=stn.name if stn else "",
            source_type=src.source_type,
            sample_result=result,
            sample_date=sample.collection_date if sample else now,
            report_date=report.report_date,
            lab_name=lab_obj.name if lab_obj else "",
            failed_parameters=fp_json,
            remarks=f"Water source {src.source_id_code} returned {result} result.",
            status=status,
            due_date=now + datetime.timedelta(hours=48) if status == "OPEN" else now - datetime.timedelta(days=1),
            is_escalated=is_escalated,
            escalation_level=1 if is_escalated else 0,
            escalated_at=now - datetime.timedelta(days=1) if is_escalated else None,
            acknowledged_at=now - datetime.timedelta(days=ack_days) if ack_days else None,
            created_at=report.report_date or now,
        )
        db.add(a); db.flush()

        # Notifications
        officers = get_concerned_officers(db, src.id)
        for o in officers:
            db.add(AlertNotification(
                alert_id=a.id, user_id=o.id,
                recipient_name=o.name, recipient_role=o.role, recipient_email=o.email,
                status="SIMULATED", sent_at=now,
            ))

        # Corrective Action
        count = db.query(CorrectiveAction).count() + 1
        ca = CorrectiveAction(
            action_id=f"CA-2024-{count:04d}",
            alert_id=a.id, water_source_id=src.id,
            problem_description=f"Source {src.source_id_code}: {result} result detected.",
            failed_parameters=", ".join(fp["name"] for fp in fp_json),
            corrective_action_description=(
                "1. Immediately investigate the water source.\n"
                "2. Conduct thorough disinfection.\n"
                "3. Arrange repeat sample after corrective action."
            ),
            status="OPEN" if status in ("OPEN", "ACKNOWLEDGED") else "COMPLETED",
            target_date=now + datetime.timedelta(days=7),
            completed_date=now - datetime.timedelta(days=1) if status not in ("OPEN", "ACKNOWLEDGED") else None,
            created_at=a.created_at,
        )
        db.add(ca); db.flush()

        # Repeat Sample
        rs_count = db.query(RepeatSample).count() + 1
        db.add(RepeatSample(
            repeat_sample_id=f"RS-2024-{rs_count:04d}",
            alert_id=a.id, water_source_id=src.id,
            scheduled_date=now + datetime.timedelta(days=7),
            status="DUE" if status in ("OPEN", "ACKNOWLEDGED", "CORRECTIVE_ACTION") else "COLLECTED",
            created_at=a.created_at,
        ))
        db.commit()
        return a

    # Reverse param map
    param_map_rev = {v.id: k for k, v in param_map.items()}

    r1_fresh = db.query(LabReport).filter(LabReport.report_id == "RPT-DEMO-001").first()
    r2_fresh = db.query(LabReport).filter(LabReport.report_id == "RPT-DEMO-002").first()

    if r1_fresh:
        make_alert("ALT-2024-0001", r1_fresh, "MAS-OW-01", "UNFIT", "OPEN")
    if r2_fresh:
        make_alert("ALT-2024-0002", r2_fresh, "SA-BW-01", "UNSATISFACTORY", "ACKNOWLEDGED", ack_days=2)

    # Persistent failure alerts
    for i, rid in enumerate(["RPT-PGT-001", "RPT-PGT-002", "RPT-PGT-003"]):
        r = db.query(LabReport).filter(LabReport.report_id == rid).first()
        if r:
            make_alert(f"ALT-2024-PGT-{i+1:02d}", r, "PGT-BW-01", "UNFIT",
                      status="ESCALATED" if i == 2 else "CORRECTIVE_ACTION",
                      is_escalated=(i == 2))

    print("  [ALERTS] Demo alerts seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # ESCALATION RULES
    # ─────────────────────────────────────────────────────────────────────────
    from models.workflow import EscalationRule

    rules = [
        dict(name="Critical UNFIT — 48h to Division", severity="CRITICAL",
             level=1, delay_hours=48, escalate_to_role="DIVISIONAL_OFFICER"),
        dict(name="Critical UNFIT — 96h to Zone", severity="CRITICAL",
             level=2, delay_hours=96, escalate_to_role="ZONAL_ADMIN"),
        dict(name="Persistent Failure — Central", severity="CRITICAL",
             level=3, delay_hours=120, escalate_to_role="CENTRAL_ADMIN"),
    ]
    for rule in rules:
        existing = db.query(EscalationRule).filter(EscalationRule.name == rule["name"]).first()
        if not existing:
            db.add(EscalationRule(**rule, alert_type="WATER_QUALITY", is_active=True))
    db.commit()
    print("  [RULES] Escalation rules seeded")

    # ─────────────────────────────────────────────────────────────────────────
    # AUDIT LOG — seed some initial events
    # ─────────────────────────────────────────────────────────────────────────
    from models.audit import AuditLog

    seed_logs = [
        dict(action="SYSTEM_INIT", entity_type="System", entity_id=0,
             entity_ref="IR-IWQMS", details="System initialized with demo data",
             user_name="SYSTEM", user_role="SYSTEM"),
        dict(action="RESULT_CREATED", entity_type="LabReport", entity_id=1,
             entity_ref="RPT-DEMO-001", details="Demo UNFIT report created",
             user_name="Lab Technician SR", user_role="LABORATORY"),
        dict(action="ALERT_CREATED", entity_type="Alert", entity_id=1,
             entity_ref="ALT-2024-0001",
             details="Auto-created CRITICAL alert for UNFIT result on MAS-OW-01",
             user_name="SYSTEM", user_role="SYSTEM"),
    ]
    if db.query(AuditLog).count() == 0:
        for log in seed_logs:
            db.add(AuditLog(**log, created_at=now))
        db.commit()

    print("\n[SEED] Complete!")
    print("=" * 50)
    print("Demo Logins:")
    print("  central.admin      / admin123  (Central Admin)")
    print("  zonal.admin        / admin123  (Zonal Admin)")
    print("  division.officer   / admin123  (Divisional Officer)")
    print("  hmi.user           / admin123  (H&MI)")
    print("  engineering.user   / admin123  (Engineering)")
    print("  lab.user           / admin123  (Laboratory)")
    print("  station.user       / admin123  (Station Incharge)")
    print("  management.user    / admin123  (Senior Management)")
    print("=" * 50)
    print("Demo Alerts: ALT-2024-0001 (UNFIT), ALT-2024-0002 (UNSATISFACTORY)")


if __name__ == "__main__":
    try:
        seed_all()
    finally:
        db.close()
