package com.warung.pos;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

@CapacitorPlugin(name = "TcpPrinter")
public class TcpPrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip");
        int port = call.getInt("port", 9100);
        String dataB64 = call.getString("data");

        if (ip == null || dataB64 == null) {
            call.reject("IP dan data diperlukan");
            return;
        }

        byte[] data = Base64.decode(dataB64, Base64.DEFAULT);

        new Thread(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(ip, port), 5000);
                socket.setSoTimeout(5000);

                OutputStream os = socket.getOutputStream();

                // Hantar data dalam chunks
                int chunkSize = 1024;
                for (int i = 0; i < data.length; i += chunkSize) {
                    int end = Math.min(i + chunkSize, data.length);
                    os.write(data, i, end - i);
                    os.flush();
                    Thread.sleep(50); // delay kecil antara chunks
                }

                Thread.sleep(500); // tunggu printer proses
                os.close();
                socket.close();

                JSObject result = new JSObject();
                result.put("ok", true);
                call.resolve(result);

            } catch (Exception e) {
                call.reject("Print gagal: " + e.getMessage());
            }
        }).start();
    }
}
