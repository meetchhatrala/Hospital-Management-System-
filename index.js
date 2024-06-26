import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3005;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Hospital_Management_System",
    password: "123456789",
    port: 3001,
});

db.connect();

var Login_status = {
    auth_status: 200,
    destination: "",
}

app.post('/login', (req, res) => {
    const { employee_id, password } = req.body;
    console.log(req.body);

    db.query("SELECT * FROM employee WHERE employee_id = $1", [employee_id], (err, result) => {
        if (err) {

            console.error("Error executing query", err.stack);
            res.status(500).json({ auth_status: 500, message: "Internal server error" });
            return;

        }

        if (result.rows.length === 0) {

            console.log("User not found!!");
            Login_status.auth_status = 401;
            res.send(Login_status);
            return;

        }
        var user = result.rows[0];
        console.log(user);

        if (password === user.password) {

            if (user.job_type === "Doctor") {
                db.query("SELECT * from doctor where employee_id = $1", [user.employee_id], (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    if (result.rows.length > 0) {
                        user = { ...user, ...result.rows[0] };
                        console.log("Logging doctor info", user);
                        Login_status.auth_status = 200;
                        Login_status.destination = user.job_type;
                        console.log({ ...user, ...Login_status });
                        res.send({ ...user, ...Login_status });
                    }
                    else {
                        console.log("No data found!");
                    }
                })
            }
            else if(user.job_type === "Nurse"){
                db.query("SELECT * from nurse where employee_id = $1", [user.employee_id], (err, result) => {
                    if(err){
                        console.log(err);
                    }
                    if(result.rows.length > 0){
                        user = {...user, ...result.rows[0]};
                        console.log("Logging Nurse Info", user);
                        Login_status.auth_status = 200;
                        Login_status.destination = user.job_type;
                        console.log({ ...user, ...Login_status });
                        res.send({ ...user, ...Login_status });
                    }
                    else{
                        console.log("No data found!!");
                    }
                })
            }
            else {
                console.log("User authenticated");
                Login_status.auth_status = 200;
                Login_status.destination = user.job_type;
                console.log({ ...user, ...Login_status });
                res.send({ ...user, ...Login_status });
            }

        } else {

            console.log("Invalid credentials");
            Login_status.auth_status = 401;
            res.send(Login_status);

        }
    });
});

app.post('/newEmp', (req, res) => {
    console.log(req.body);
    const recData = req.body;
    console.log(recData);

    db.query("SELECT employee_id from employee where employee_id = $1", [recData.employee_id], (err, result) => {
        if (err) {
            res.send(400); recData.
                console.log(err.message);
        }
        else if (result.rows.length !== 0) {
            res.send(201);
        }
    });

    db.query("INSERT INTO employee values ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [recData.employee_id, recData.name, recData.contact, recData.job_type, recData.hiredate, recData.password, recData.salary, recData.Gender, recData.Address], (err, result) => {
        if (err) {
            console.log(err.message);
            res.sendStatus(400);
        }
        else {
            console.log("Data Inserted!!");
            if (recData.job_type === "Doctor") {
                db.query("INSERT INTO doctor values ($1, $2, $3, $4, $5, $6)", [recData.d_id, recData.employee_id, recData.name, recData.dtype, recData.department, recData.study_year], (err, result) => {
                    if (err) {
                        console.log(err.message);
                    }
                    else {
                        console.log("Doctor Inserted!!");
                        console.log(result);
                        res.sendStatus(200);
                    }
                });
            }
            else if (recData.job_type === "Nurse") {
                db.query("INSERT INTO nurse values ($1, $2, $3, $4)", [recData.employee_id, recData.nurse_id, recData.name, recData.department], (err, result) => {
                    if (err) {
                        console.log(err.message);
                    }
                    else {
                        res.sendStatus(200);
                    }
                });
            }
            else if (recData.job_type === "Receptionist") {
                res.sendStatus(200);
            }
        }
    });
});

var emp_data;

app.get('/emp_data',async (req, res) => {
    console.log(req.query.employee);
    const job_type = req.query.employee;
    if(job_type === "Doctor"){
        await db.query("SELECT e.employee_id, e.name, e.contact, e.job_type, TO_CHAR(e.hiredate, 'DD-MM-YYYY') as hiredate, e.password, e.salary, \"Gender\", \"Address\", d.d_id, d.dtype, d.department, d.study_year FROM employee e LEFT JOIN doctor d ON e.employee_id = d.employee_id where e.job_type = $1", [job_type], (err, result) => {
            if (err) {
    
                console.error("Error executing query", err.stack);
                res.status(500).json({ auth_status: 500, message: "Internal server error" });
                return;
    
            }
    
            if (result.rows.length > 0) {
                emp_data = result.rows;
                // console.log(emp_data);
                res.send(emp_data);
            }
        });
    }
    else if(job_type === "Nurse"){
        await db.query("SELECT e.employee_id, e.name, e.contact, e.job_type, TO_CHAR(e.hiredate, 'DD-MM-YYYY') as hiredate, e.password, e.salary, \"Gender\", \"Address\", n.nurse_id, n.departMent FROM employee e LEFT JOIN nurse n ON e.employee_id = n.employee_id where job_type = $1", [job_type], (err, result) => {
            if (err) {
    
                console.error("Error executing query", err.stack);
                res.status(500).json({ auth_status: 500, message: "Internal server error" });
                return;
    
            }
    
            if (result.rows.length > 0) {
                emp_data = result.rows;
                // console.log(emp_data);
                res.send(emp_data);
            }
        });
    }

    else if (job_type === "Receptionist"){
        await db.query("SELECT employee_id, name, contact, job_type, TO_CHAR(hiredate, 'DD-MM-YYYY') as hiredate, password, salary, \"Gender\", \"Address\" FROM employee where job_type = $1", [job_type], (err, result) => {
            if (err) {
    
                console.error("Error executing query", err.stack);
                res.status(500).json({ auth_status: 500, message: "Internal server error" });
                return;
    
            }
    
            if (result.rows.length > 0) {
                emp_data = result.rows;
                // console.log(emp_data);
                res.send(emp_data);
            }
        });
    }
})

app.get('/patients', (req, res) => {
    // console.log(req.query.department);
    const department = req.query.department;

    db.query("SELECT a.patient_id, a.name, a.gender, a.age, a.height, a.weight, a.blood_group, a.admit_date, a.discharge_date, a.contact, b.room_id, b.department, b.unit FROM patient a INNER JOIN pinfo b ON a.patient_id = b.patient_id where a.patient_id in (select patient_id from pinfo where department = $1)", 
    [department], 
    (err, result) => {
        if (err) {
            console.log(err);
            res.sendStatus(400);
        }

        if (result.rows.length > 0) {
            res.send(result.rows)
        }
    })
})

app.get('/wardInfo', (req, res) => {
    db.query("SELECT COUNT(patient_id) as totalPatients FROM patient", (err,result) => {
        if(err){
            console.log(err.message);
        }
        else{
            const data = result.rows[0];
            console.log(data);
            res.send(data);
        }
    })
})

app.get('/medInfo',async (req, res) => {
    await db.query("SELECT medicine_id, name from medicines where stock > 0", (err,result) => {
        if(err){
            console.log(err.message);
        }
        else {
            console.log(result.rows);
            res.send(result.rows);
        }
    })
})

app.post('/saveMedInfo', async (req, res) => {
    const recData = req.body;
    console.log(recData);

    await recData.patients.forEach(id => {
        const date = new Date();
        console.log(recData.medicines);
        
        let medicines = [];
        let timings = [];

        recData.medicines.forEach(medicine => {
            medicines.push(medicine.medicine_id);
            timings.push(medicine.timing);
        });

        db.query("INSERT into medication_history(patient_id, medicines, prescription_date, timing) values ($1, $2, $3, $4)", [id, medicines, date.toLocaleDateString(), timings], (err,result) => {
            if(err){
                console.log(err.message);
                res.send({status: 201});
            }
            else{
                console.log("Medications successfully uploaded");
            }
        })
    });
    res.send({status: 200});
})

app.get("/patUR", async (req, res) => {
    const department = req.query.department;
    await db.query("SELECT a.patient_id, a.name, a.gender, a.age, a.height, a.weight, a.blood_group, a.admit_date, a.discharge_date, a.contact, b.room_id, b.department, b.unit FROM patient a INNER JOIN pinfo b ON a.patient_id = b.patient_id where a.patient_id in (select patient_id from pinfo where department = $1 and room_id is null) order by patient_id",
    [department],
    (err, result) => {
        if(err){
            console.log(err);
            return;
        }
        if(result.rows.length > 0){
            // console.log(result.rows);
            res.send(result.rows);
        }
    })
})
app.get("/patAR", async (req, res) => {
    const department = req.query.department;
    await db.query("SELECT a.patient_id, a.name, a.gender, a.age, a.height, a.weight, a.blood_group, a.admit_date, a.discharge_date, a.contact, b.room_id, b.department, b.unit FROM patient a INNER JOIN pinfo b ON a.patient_id = b.patient_id where a.patient_id in (select patient_id from pinfo where department = $1 and room_id is not null) order by patient_id",
    [department],
    (err, result) => {
        if(err){
            console.log(err);
            return;
        }
        if(result.rows.length > 0){
            // console.log(result.rows);
            res.send(result.rows);
        }
    })
})

app.get("/avlRooms", async (req,res) => {
    const roomType = req.query.roomType;
    await db.query("SELECT room_number, room_id from rooms where room_type = $1 and occupied = false ORDER BY room_number", [roomType], (err, result) => {
        if (err){
            console.log(err);
        }
        else {
            console.log(result.rows);
            res.send(result.rows);
        }
    })
})

app.post("/assignRoom", async (req,res) => {
    // const {patient_id, room} = req.query;
    // console.log(room.room_number);
    // console.log(req.query);
    // res.send(200); 

    const patient_id = req.body.patient_id;
    const room_number = req.body.room_number;
    const room_id = req.body.room_id;
    console.log(patient_id, room_number, room_id);

    await db.query("UPDATE rooms SET patient_id = $1, occupied = true WHERE room_number = $2 and room_id = $3", [patient_id, room_number, room_id], (err, result) => {
        if(err){
            console.log(err.message);
        }
        else{
            db.query("UPDATE pinfo SET room_id = $1 WHERE patient_id = $2", [room_id, patient_id], (err, result) => {
                if(err){
                    console.log(err.message);
                }
                else{
                    res.send({status: 200});
                }
            })
        }
    })
})

app.post('/newPatient', async (req, res) => {
    const date = new Date();
    const currentDate = date.toLocaleDateString();
    console.log(currentDate);
    let currentCount = 0;
    let patient_id;
    let height = req.body.ft + "\'" + req.body.in + "\"";
    console.log(height);

    const currentMonth = date.toLocaleString("default", { month: "long" });
    console.log("Current Month:",currentMonth);

    const department = req.body.department;
    console.log(department);

    await db.query("select * from patient_count where department = $1", [department], (err, result) => {
        if(err){
            console.log(err.message);
        }
        else{
            console.log( "Month in Table: ", result.rows[0].count_month);
            if(result.rows[0].count_month !== currentMonth){
                db.query("update patient_count set count_month = $1, patient_count = 0 where department = $2", [currentMonth, department], (err, result) => {
                    if(err){
                        console.log(err.message);
                    }
                    else{
                        console.log("Count month updated!!");
                        currentCount = 0;
                        // patient_id = req.body.unit + String(currentCount+1);
                        // console.log(patient_id);
                    }
                })
            }
            else{
                currentCount = result.rows[0].patient_count;
            }
            patient_id = req.body.unit + String(currentCount+1);
            console.log(patient_id);
            console.log(currentCount);
            db.query("INSERT INTO patient values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
            [patient_id, req.body.name, req.body.gender, req.body.age, height, req.body.weight, req.body.blood_group, currentDate, ,  req.body.contact, req.body.relative_name, req.body.relative_contact, req.body.address, false],
            (err, result) => {
                if(err) {
                    console.log(err);
                }
                else{
                    db.query("INSERT INTO pinfo values ($1, $2, $3, $4, $5, $6)", 
                    [patient_id, req.body.name, currentDate, ,req.body.department, req.body.unit], 
                    (err, result) => {
                        if(err) {
                            console.log(err);
                        }
                        else{
                            db.query("UPDATE patient_count SET patient_count = $1 where department = $2", [currentCount+1, req.body.department], (err, result) => {
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    console.log("Patient Admitted Successfully");
                                    res.send({status: 200});
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

app.get('/allPatients', async (req, res) => {
    console.log("Fetching data of all patients!!\n");
    await db.query("SELECT a.*, b.room_id, b.department, b.unit FROM patient a inner join pinfo b on a.patient_id = b.patient_id where a.is_discharged = false", (err, result) => {
        if(err){
            console.log(err);
        }
        else if(result.rows.length > 0){
            console.log("Patient data successfully fetched!");
            res.send(result.rows)
        }
    })
})

app.post('/dischargePatient', async (req, res) => {
    const patient_id = req.body.patient_id;
    
    await db.query("UPDATE patient set is_discharged = 'true' WHERE patient_id = $1", [patient_id], (err, result) => {
        if(err){
            console.log(err);
        }
        else{
            console.log("Patient Discharged Successfully");
            res.send({status: 200});
        }
    })
})

app.listen(port, () => {
    console.log(`Server running on: http://localhost:${port}`);
})