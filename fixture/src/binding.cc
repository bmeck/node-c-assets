#define NULL 0
typedef struct {
  const int name_length;
  const char* name;
  const int size;
  const char* data; 
} bundled_asset_t;

//const bundled_asset_t assets[] = {
//  {2,"x",5,"test"},
//};

#include <string.h>
#include <node/node_buffer.h>
#include <node/v8.h>
#include "assets.c"
const int asset_count = sizeof(assets)/sizeof(bundled_asset_t);

const bundled_asset_t* assetByName(const char* name, const int length) {
  int i = 0;
  if (asset_count != 0) for(; i < asset_count; i++) {
    const bundled_asset_t* asset = &assets[i];
    if (length == asset->name_length && strncmp(name, asset->name, length) == 0) {
      return asset;
    }
  }
  return NULL;
}

using namespace v8;
using namespace node;

Handle<Value> GetAsset(const Arguments& args) {
  HandleScope scope;
  const Local<String> asset_name = args[0]->ToString();
  const int length = asset_name->Utf8Length();
  char name[length] ;
  asset_name->WriteUtf8(name);
  const bundled_asset_t* asset = assetByName(name, length);
  if (!asset) {
    return scope.Close(Null());
  }
  return scope.Close(Buffer::New((char*)asset->data, asset->size)->handle_);
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("getAsset"),
      FunctionTemplate::New(GetAsset)->GetFunction());
}

NODE_MODULE(assets, init)