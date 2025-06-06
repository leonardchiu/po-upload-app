import Layout from "@/components/layout";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Welcome</h2>
        <p className="text-gray-600">
          Use the menu to upload a purchase order or view past records.
        </p>
      </div>
    </Layout>
  );
}
