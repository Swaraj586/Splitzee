//package com.splitzee;
//
//import com.splitzee.model.User;
//import org.hibernate.Session;
//import org.hibernate.SessionFactory;
//import org.hibernate.Transaction;
//import org.hibernate.cfg.Configuration;
//import java.util.HashMap;
//
////TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
//// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
//public class Main {
//    public static void main(String[] args) {
//        User obj = new User();
//        obj.setEmail("xyz@gmail.com");
//        obj.setName("xyz");
//
//        HashMap<String, Double> bal = new HashMap<String, Double>();
//        bal.put("abc@gmail.com",-2000.0);
//        obj.setBalance(bal);
//
//        Configuration config = new Configuration();
//        config.addAnnotatedClass(User.class);
//        config.configure("hibernate.cfg.xml");
//
//        SessionFactory factory = config.buildSessionFactory();
//        Session session = factory.openSession();
//        Transaction transaction = session.beginTransaction();     //transaction for update/create
//        session.persist(obj);      // .merge for updating .remove for deleting
//
////        User u1 = session.find(User.class, "abc@gmail.com");    //Eager Fetching (fetches everytime)
////        User u1 = session.byId(User.class).getReference("abc@gmail.com");  //Lazy Fetching (fetches when called)
////        System.out.println(u1);
//        transaction.commit();
//
//        session.close();
//        factory.close();
//    }
//}